-- Campaign validation needs three-photo intake, seller segmentation, and
-- first-party attribution on the private submission ledger. Existing rows
-- remain honestly unclassified instead of being backfilled as a seller type.
alter table public.submissions
  drop constraint submissions_expected_file_count_check;

alter table public.submissions
  add constraint submissions_expected_file_count_check
  check (expected_file_count between 3 and 15);

alter table public.submissions
  add column seller_type text,
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text,
  add column utm_term text;

alter table public.submissions
  add constraint submissions_seller_type_check
    check (
      seller_type is null
      or seller_type in ('private_seller', 'dealer')
    ),
  add constraint submissions_utm_source_length_check
    check (
      utm_source is null
      or char_length(utm_source) between 1 and 200
    ),
  add constraint submissions_utm_medium_length_check
    check (
      utm_medium is null
      or char_length(utm_medium) between 1 and 200
    ),
  add constraint submissions_utm_campaign_length_check
    check (
      utm_campaign is null
      or char_length(utm_campaign) between 1 and 200
    ),
  add constraint submissions_utm_content_length_check
    check (
      utm_content is null
      or char_length(utm_content) between 1 and 200
    ),
  add constraint submissions_utm_term_length_check
    check (
      utm_term is null
      or char_length(utm_term) between 1 and 200
    );

-- Preserve any legacy conversion record that predates the explicit delivery
-- lifecycle invariant without inventing a timestamp newer than the conversion.
update public.submissions
set delivered_at = coalesce(converted_at, updated_at, created_at)
where status = 'converted'
  and delivered_at is null;

alter table public.submissions
  add constraint submissions_conversion_delivery_check
    check (status <> 'converted' or delivered_at is not null);

-- Lifecycle analytics remain database-authored so an event exists only after
-- the corresponding durable state transition succeeds.
create or replace function private.record_submission_status_analytics()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_metadata jsonb;
begin
  if new.upload_state = 'complete' and new.status is distinct from old.status then
    v_metadata := pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'seller_type', new.seller_type,
        'utm_source', new.utm_source,
        'utm_medium', new.utm_medium,
        'utm_campaign', new.utm_campaign,
        'utm_content', new.utm_content,
        'utm_term', new.utm_term
      )
    );

    if new.status = 'delivered' then
      new.delivered_at := coalesce(new.delivered_at, statement_timestamp());
      insert into public.analytics_events (
        submission_id,
        event_name,
        metadata
      )
      values (new.id, 'preview_delivered', v_metadata)
      on conflict (submission_id, event_name)
        where submission_id is not null
          and event_name in ('submission_completed', 'preview_delivered', 'converted')
      do nothing;
    elsif new.status = 'converted' then
      new.converted_at := coalesce(new.converted_at, statement_timestamp());
      insert into public.analytics_events (
        submission_id,
        event_name,
        metadata
      )
      values (new.id, 'converted', v_metadata)
      on conflict (submission_id, event_name)
        where submission_id is not null
          and event_name in ('submission_completed', 'preview_delivered', 'converted')
      do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- Function identity includes argument types, so remove the currently active
-- currency-aware signature before installing the campaign-aware intake RPC.
drop function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, text, integer, text, text, text, text, boolean, jsonb
);

create function public.begin_submission(
  p_submission_id uuid,
  p_ip_hash text,
  p_idempotency_key_hash text,
  p_request_fingerprint text,
  p_rate_limit integer,
  p_request_rate_limit integer,
  p_window_seconds integer,
  p_phone text,
  p_customer_name text,
  p_seller_type text,
  p_vehicle_model text,
  p_vehicle_year smallint,
  p_price numeric,
  p_price_currency text,
  p_mileage integer,
  p_engine text,
  p_transmission text,
  p_location text,
  p_additional_info text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_utm_term text,
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
    or p_seller_type is null
    or p_seller_type not in ('private_seller', 'dealer')
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
    seller_type,
    vehicle_model,
    vehicle_year,
    price,
    price_currency,
    mileage,
    engine,
    transmission,
    location,
    additional_info,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    expected_file_count,
    consent_given,
    idempotency_key_hash,
    request_fingerprint
  )
  values (
    p_submission_id,
    p_phone,
    p_customer_name,
    p_seller_type,
    p_vehicle_model,
    p_vehicle_year,
    p_price,
    p_price_currency,
    p_mileage,
    p_engine,
    p_transmission,
    p_location,
    p_additional_info,
    nullif(pg_catalog.btrim(p_utm_source), ''),
    nullif(pg_catalog.btrim(p_utm_medium), ''),
    nullif(pg_catalog.btrim(p_utm_campaign), ''),
    nullif(pg_catalog.btrim(p_utm_content), ''),
    nullif(pg_catalog.btrim(p_utm_term), ''),
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

-- Keep completion idempotent and atomic while attaching campaign dimensions to
-- the authoritative conversion event.
create or replace function public.complete_submission(
  p_submission_id uuid,
  p_uploaded_files jsonb
)
returns table (
  public_reference text,
  vehicle_model text,
  photo_count integer,
  completed_at timestamptz,
  already_complete boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_submission public.submissions%rowtype;
  v_expected_count integer;
  v_now timestamptz := statement_timestamp();
begin
  if p_submission_id is null or jsonb_typeof(p_uploaded_files) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_completion_parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'autopost:completion:' || p_submission_id::text,
      0
    )
  );

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'submission_not_found';
  end if;

  select count(*)::integer
  into v_expected_count
  from public.submission_files
  where submission_id = p_submission_id
    and file_type = 'source_photo';

  if v_submission.upload_state = 'complete' then
    public_reference := v_submission.public_reference;
    vehicle_model := v_submission.vehicle_model;
    photo_count := v_expected_count;
    completed_at := v_submission.completed_at;
    already_complete := true;
    return next;
    return;
  end if;

  if v_submission.upload_state <> 'pending'
    or v_expected_count <> v_submission.expected_file_count
    or jsonb_array_length(p_uploaded_files) <> v_expected_count
    or (
      select count(distinct uploaded.value->>'path')
      from jsonb_array_elements(p_uploaded_files) as uploaded(value)
    ) <> v_expected_count
    or exists (
      select 1
      from public.submission_files as expected
      where expected.submission_id = p_submission_id
        and not exists (
          select 1
          from jsonb_array_elements(p_uploaded_files) as uploaded(value)
          where uploaded.value->>'path' = expected.storage_path
            and (uploaded.value->>'fileSize')::bigint = expected.file_size
            and lower(uploaded.value->>'mimeType') = expected.mime_type
        )
    )
  then
    raise exception using errcode = 'P0001', message = 'upload_verification_failed';
  end if;

  update public.submission_files
  set verified_at = v_now
  where submission_id = p_submission_id;

  update public.submissions
  set upload_state = 'complete', completed_at = v_now
  where id = p_submission_id
  returning submissions.public_reference,
            submissions.vehicle_model,
            submissions.completed_at
  into public_reference, vehicle_model, completed_at;

  insert into public.analytics_events (submission_id, event_name, metadata)
  values (
    p_submission_id,
    'submission_completed',
    pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'photo_count', v_expected_count,
        'seller_type', v_submission.seller_type,
        'utm_source', v_submission.utm_source,
        'utm_medium', v_submission.utm_medium,
        'utm_campaign', v_submission.utm_campaign,
        'utm_content', v_submission.utm_content,
        'utm_term', v_submission.utm_term
      )
    )
  )
  on conflict (submission_id, event_name)
    where submission_id is not null
      and event_name in ('submission_completed', 'preview_delivered', 'converted')
  do nothing;

  photo_count := v_expected_count;
  already_complete := false;
  return next;
end;
$$;

-- A verified payment can arrive before an operator has marked the preview as
-- delivered. Preserve the delivered-before-converted invariant by recording
-- both durable transitions inside the same payment-confirmation transaction.
create or replace function public.confirm_tbc_payment(
  p_provider_payment_id text,
  p_provider_status text,
  p_amount numeric,
  p_currency text,
  p_result_code text,
  p_verified_payload jsonb,
  p_delivery_url text
)
returns table (
  submission_id uuid,
  payment_status text,
  should_start_paid_generation boolean,
  paid_start_token text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_fulfillment public.fulfillments%rowtype;
  v_normalized_status text;
  v_submission_status text;
  v_now timestamptz := statement_timestamp();
begin
  if p_provider_payment_id is null
    or char_length(p_provider_payment_id) not between 3 and 120
    or p_verified_payload is null
    or jsonb_typeof(p_verified_payload) <> 'object'
    or pg_column_size(p_verified_payload) > 16384
    or nullif(pg_catalog.btrim(p_delivery_url), '') is null
    or char_length(p_delivery_url) > 2048
  then
    raise exception using errcode = '22023', message = 'invalid_payment_verification';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'autopost:tbc-payment:' || p_provider_payment_id,
      0
    )
  );

  select *
  into v_payment
  from public.payments
  where provider = 'tbc'
    and provider_payment_id = p_provider_payment_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'payment_not_found';
  end if;

  v_normalized_status := case p_provider_status
    when 'Created' then 'created'
    when 'Processing' then 'processing'
    when 'PaymentCompletionProcessing' then 'processing'
    when 'CancelPaymentProcessing' then 'processing'
    when 'WaitingConfirm' then 'processing'
    when 'Succeeded' then 'succeeded'
    when 'Failed' then 'failed'
    when 'Expired' then 'expired'
    when 'Returned' then 'returned'
    when 'PartialReturned' then 'returned'
    else 'failed'
  end;

  if v_normalized_status = 'succeeded'
    and (p_amount <> v_payment.amount or p_currency <> v_payment.currency)
  then
    raise exception using errcode = 'P0001', message = 'payment_amount_mismatch';
  end if;

  if v_payment.status = 'succeeded' then
    v_normalized_status := 'succeeded';
  end if;

  should_start_paid_generation := false;
  paid_start_token := null;

  update public.payments
  set status = v_normalized_status,
      provider_result_code = nullif(pg_catalog.btrim(p_result_code), ''),
      verified_payload = p_verified_payload,
      paid_at = case
        when v_normalized_status = 'succeeded' then coalesce(paid_at, v_now)
        else null
      end
  where id = v_payment.id;

  if v_normalized_status = 'succeeded' then
    update public.submissions as target
    set amount_paid = v_payment.amount,
        delivery_url = p_delivery_url
    where target.id = v_payment.submission_id
      and target.upload_state = 'complete'
    returning target.status into v_submission_status;

    if found and v_submission_status not in ('delivered', 'converted') then
      update public.submissions as target
      set status = 'delivered'
      where target.id = v_payment.submission_id;
    end if;

    if v_submission_status is not null
      and v_submission_status <> 'converted'
    then
      update public.submissions as target
      set status = 'converted'
      where target.id = v_payment.submission_id;
    end if;

    select *
    into v_fulfillment
    from public.fulfillments
    where fulfillments.submission_id = v_payment.submission_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'paid_fulfillment_missing';
    end if;

    if v_fulfillment.status <> 'ready'
      and v_fulfillment.paid_workflow_run_id is null
    then
      paid_start_token := 'starting:' || pg_catalog.gen_random_uuid()::text;
      update public.fulfillments
      set status = 'generating_paid',
          paid_workflow_run_id = paid_start_token,
          paid_started_at = v_now,
          failed_at = null,
          last_error_code = null
      where fulfillments.submission_id = v_payment.submission_id;
      should_start_paid_generation := true;
    end if;
  end if;

  submission_id := v_payment.submission_id;
  payment_status := v_normalized_status;
  return next;
end;
$$;

revoke execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, text,
  smallint, numeric, text, integer, text, text, text, text, text, text, text,
  text, text, boolean, jsonb
) from public, anon, authenticated;

grant execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, text,
  smallint, numeric, text, integer, text, text, text, text, text, text, text,
  text, text, boolean, jsonb
) to service_role;

revoke execute on function public.complete_submission(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_submission(uuid, jsonb)
  to service_role;

revoke execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) to service_role;

revoke execute on function private.record_submission_status_analytics()
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.record_submission_status_analytics()
  to service_role;

comment on column public.submissions.seller_type is
  'Campaign segmentation supplied by new submissions; null denotes a legacy row.';
comment on column public.submissions.utm_source is
  'Optional UTM source captured from the submission landing session.';
comment on column public.submissions.utm_medium is
  'Optional UTM medium captured from the submission landing session.';
comment on column public.submissions.utm_campaign is
  'Optional UTM campaign captured from the submission landing session.';
comment on column public.submissions.utm_content is
  'Optional UTM content captured from the submission landing session.';
comment on column public.submissions.utm_term is
  'Optional UTM term captured from the submission landing session.';
comment on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, text,
  smallint, numeric, text, integer, text, text, text, text, text, text, text,
  text, text, boolean, jsonb
) is
  'Atomically creates/replays a three-photo-or-more campaign intake with seller segmentation and UTM attribution.';
