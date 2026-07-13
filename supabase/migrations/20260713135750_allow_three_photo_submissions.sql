-- Keep the public API and database boundary aligned: a seller can start an
-- automated preview with three to fifteen source photos.
alter table public.submissions
  drop constraint submissions_expected_file_count_check;

alter table public.submissions
  add constraint submissions_expected_file_count_check
  check (expected_file_count between 3 and 15);

create or replace function public.begin_submission(
  p_submission_id uuid,
  p_ip_hash text,
  p_idempotency_key_hash text,
  p_request_fingerprint text,
  p_rate_limit integer,
  p_request_rate_limit integer,
  p_window_seconds integer,
  p_phone text,
  p_customer_name text,
  p_vehicle_model text,
  p_vehicle_year smallint,
  p_price numeric,
  p_price_currency text,
  p_mileage integer,
  p_engine text,
  p_transmission text,
  p_location text,
  p_additional_info text,
  p_consent_given boolean,
  p_files jsonb
)
returns table (
  submission_id uuid,
  public_reference text,
  rate_limited boolean,
  retry_after_seconds integer,
  was_existing boolean,
  idempotency_conflict boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.submissions%rowtype;
  v_limit_result record;
  v_file jsonb;
  v_file_count integer;
begin
  if p_submission_id is null
    or p_idempotency_key_hash !~ '^v1:[a-f0-9]{64}$'
    or p_request_fingerprint !~ '^v1:[a-f0-9]{64}$'
    or p_price_currency not in ('GEL', 'USD')
    or jsonb_typeof(p_files) <> 'array'
  then
    raise exception using errcode = '22023', message = 'invalid_submission_parameters';
  end if;

  v_file_count := jsonb_array_length(p_files);
  if v_file_count < 3 or v_file_count > 15 then
    raise exception using errcode = '22023', message = 'invalid_file_count';
  end if;

  select *
  into v_limit_result
  from public.consume_rate_limit(
    'submission_init_request',
    p_ip_hash,
    p_request_rate_limit,
    p_window_seconds
  );

  if not v_limit_result.allowed then
    submission_id := null;
    public_reference := null;
    rate_limited := true;
    retry_after_seconds := v_limit_result.retry_after_seconds;
    was_existing := false;
    idempotency_conflict := false;
    return next;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'autopost:idempotency:' || p_idempotency_key_hash,
      0
    )
  );

  select *
  into v_existing
  from public.submissions
  where idempotency_key_hash = p_idempotency_key_hash;

  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      submission_id := null;
      public_reference := null;
      rate_limited := false;
      retry_after_seconds := 0;
      was_existing := true;
      idempotency_conflict := true;
      return next;
      return;
    end if;

    submission_id := v_existing.id;
    public_reference := v_existing.public_reference;
    rate_limited := false;
    retry_after_seconds := 0;
    was_existing := true;
    idempotency_conflict := false;
    return next;
    return;
  end if;

  select *
  into v_limit_result
  from public.consume_rate_limit(
    'submission_init',
    p_ip_hash,
    p_rate_limit,
    p_window_seconds
  );

  if not v_limit_result.allowed then
    submission_id := null;
    public_reference := null;
    rate_limited := true;
    retry_after_seconds := v_limit_result.retry_after_seconds;
    was_existing := false;
    idempotency_conflict := false;
    return next;
    return;
  end if;

  insert into public.submissions (
    id,
    phone,
    customer_name,
    vehicle_model,
    vehicle_year,
    price,
    price_currency,
    mileage,
    engine,
    transmission,
    location,
    additional_info,
    expected_file_count,
    consent_given,
    idempotency_key_hash,
    request_fingerprint
  )
  values (
    p_submission_id,
    p_phone,
    p_customer_name,
    p_vehicle_model,
    p_vehicle_year,
    p_price,
    p_price_currency,
    p_mileage,
    p_engine,
    p_transmission,
    p_location,
    p_additional_info,
    v_file_count,
    p_consent_given,
    p_idempotency_key_hash,
    p_request_fingerprint
  )
  returning id, submissions.public_reference
  into submission_id, public_reference;

  for v_file in
    select value from jsonb_array_elements(p_files)
  loop
    if v_file->>'storagePath' not like (
      'submissions/' || p_submission_id::text || '/%'
    ) then
      raise exception using errcode = '22023', message = 'invalid_storage_path';
    end if;

    insert into public.submission_files (
      submission_id,
      storage_path,
      original_filename,
      mime_type,
      file_size,
      sort_order
    )
    values (
      p_submission_id,
      v_file->>'storagePath',
      v_file->>'originalFilename',
      lower(v_file->>'mimeType'),
      (v_file->>'fileSize')::bigint,
      (v_file->>'sortOrder')::smallint
    );
  end loop;

  rate_limited := false;
  retry_after_seconds := 0;
  was_existing := false;
  idempotency_conflict := false;
  return next;
end;
$$;

revoke execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, text, integer, text, text, text, text, boolean, jsonb
) from public, anon, authenticated;

grant execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, text, integer, text, text, text, text, boolean, jsonb
) to service_role;

comment on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, text, integer, text, text, text, text, boolean, jsonb
) is
  'Atomically creates or replays an intake with three to fifteen source photos.';
