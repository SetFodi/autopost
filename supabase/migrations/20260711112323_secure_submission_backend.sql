-- AutoPost secure intake schema.
-- All application access goes through server-side service-role clients. Public
-- roles receive no table or function privileges and there are intentionally no
-- permissive RLS policies on these tables.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null default (
    'AP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  phone text not null,
  customer_name text,
  vehicle_model text not null,
  vehicle_year smallint not null,
  price numeric(12, 2) not null,
  mileage integer,
  engine text,
  transmission text,
  location text,
  additional_info text,
  status text not null default 'new',
  upload_state text not null default 'pending',
  expected_file_count smallint not null,
  consent_given boolean not null,
  internal_notes text,
  delivery_url text,
  amount_paid numeric(12, 2) not null default 0,
  delivered_at timestamptz,
  converted_at timestamptz,
  completed_at timestamptz,
  cleanup_claimed_at timestamptz,
  cleanup_claim_token uuid,
  idempotency_key_hash text not null,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint submissions_public_reference_key unique (public_reference),
  constraint submissions_idempotency_key_hash_key unique (idempotency_key_hash),
  constraint submissions_public_reference_format_check
    check (public_reference ~ '^AP-[A-F0-9]{10}$'),
  constraint submissions_phone_format_check
    check (phone ~ '^\+9955[0-9]{8}$'),
  constraint submissions_customer_name_length_check
    check (customer_name is null or char_length(customer_name) between 1 and 100),
  constraint submissions_vehicle_model_length_check
    check (char_length(vehicle_model) between 2 and 120),
  constraint submissions_vehicle_year_check
    check (vehicle_year between 1900 and 2100),
  constraint submissions_price_check
    check (price > 0 and price <= 100000000),
  constraint submissions_mileage_check
    check (mileage is null or mileage between 0 and 10000000),
  constraint submissions_engine_length_check
    check (engine is null or char_length(engine) between 1 and 80),
  constraint submissions_transmission_length_check
    check (transmission is null or char_length(transmission) between 1 and 80),
  constraint submissions_location_length_check
    check (location is null or char_length(location) between 1 and 120),
  constraint submissions_additional_info_length_check
    check (additional_info is null or char_length(additional_info) between 1 and 2000),
  constraint submissions_status_check
    check (
      status in (
        'new',
        'in_progress',
        'preview_ready',
        'delivered',
        'converted',
        'rejected'
      )
    ),
  constraint submissions_upload_state_check
    check (upload_state in ('pending', 'complete', 'failed')),
  constraint submissions_expected_file_count_check
    check (expected_file_count between 5 and 15),
  constraint submissions_consent_check check (consent_given),
  constraint submissions_internal_notes_length_check
    check (internal_notes is null or char_length(internal_notes) <= 5000),
  constraint submissions_delivery_url_length_check
    check (delivery_url is null or char_length(delivery_url) <= 2048),
  constraint submissions_amount_paid_check
    check (amount_paid >= 0 and amount_paid <= 100000000),
  constraint submissions_idempotency_hash_check
    check (idempotency_key_hash ~ '^v1:[a-f0-9]{64}$'),
  constraint submissions_request_fingerprint_check
    check (request_fingerprint ~ '^v1:[a-f0-9]{64}$'),
  constraint submissions_cleanup_claim_pair_check
    check (
      (cleanup_claimed_at is null and cleanup_claim_token is null)
      or (cleanup_claimed_at is not null and cleanup_claim_token is not null)
    )
);

create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_type text not null default 'source_photo',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null,
  sort_order smallint not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),

  constraint submission_files_storage_path_key unique (storage_path),
  constraint submission_files_submission_sort_key unique (submission_id, sort_order),
  constraint submission_files_file_type_check check (file_type = 'source_photo'),
  constraint submission_files_storage_path_check
    check (
      storage_path ~ (
        '^submissions/' || submission_id::text ||
        '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}' ||
        '\.(jpg|png|webp|heic|heif)$'
      )
    ),
  constraint submission_files_original_filename_length_check
    check (char_length(original_filename) between 1 and 255),
  constraint submission_files_mime_type_check
    check (
      mime_type in (
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
      )
    ),
  constraint submission_files_file_size_check
    check (file_size between 1 and 12582912),
  constraint submission_files_sort_order_check check (sort_order between 0 and 14)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint analytics_events_name_check
    check (
      event_name in (
        'landing_view',
        'primary_cta_click',
        'form_started',
        'photo_added',
        'submission_completed',
        'whatsapp_clicked',
        'preview_delivered',
        'converted'
      )
    ),
  constraint analytics_events_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint analytics_events_metadata_size_check
    check (pg_column_size(metadata) <= 8192)
);

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),

  constraint rate_limit_events_scope_check
    check (
      scope in (
        'submission_init_request',
        'submission_init',
        'public_analytics'
      )
    ),
  constraint rate_limit_events_ip_hash_check
    check (ip_hash ~ '^v1:[a-f0-9]{64}$')
);

create index submissions_upload_status_created_idx
  on public.submissions (upload_state, status, created_at desc);
create index submissions_phone_idx on public.submissions (phone);
create index submissions_cleanup_candidates_idx
  on public.submissions (created_at)
  where upload_state in ('pending', 'failed');
create index submission_files_submission_id_idx
  on public.submission_files (submission_id, sort_order);
create index analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);
create index analytics_events_submission_id_idx
  on public.analytics_events (submission_id, created_at desc)
  where submission_id is not null;
create unique index analytics_events_single_conversion_idx
  on public.analytics_events (submission_id, event_name)
  where submission_id is not null
    and event_name in ('submission_completed', 'preview_delivered', 'converted');
create index rate_limit_events_lookup_idx
  on public.rate_limit_events (scope, ip_hash, created_at desc);
create index rate_limit_events_created_idx
  on public.rate_limit_events (created_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function private.set_updated_at();

create or replace function private.record_submission_status_analytics()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.upload_state = 'complete' and new.status is distinct from old.status then
    if new.status = 'delivered' then
      new.delivered_at := coalesce(new.delivered_at, statement_timestamp());
      insert into public.analytics_events (submission_id, event_name)
      values (new.id, 'preview_delivered')
      on conflict (submission_id, event_name)
        where submission_id is not null
          and event_name in ('submission_completed', 'preview_delivered', 'converted')
      do nothing;
    elsif new.status = 'converted' then
      new.converted_at := coalesce(new.converted_at, statement_timestamp());
      insert into public.analytics_events (submission_id, event_name)
      values (new.id, 'converted')
      on conflict (submission_id, event_name)
        where submission_id is not null
          and event_name in ('submission_completed', 'preview_delivered', 'converted')
      do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger submissions_record_status_analytics
before update of status on public.submissions
for each row execute function private.record_submission_status_analytics();

-- Atomically consumes a rate-limit slot. The transaction advisory lock makes
-- concurrent requests for the same hashed IP/scope serialize across every
-- Vercel function instance.
create or replace function public.consume_rate_limit(
  p_scope text,
  p_ip_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  current_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_count integer;
  v_oldest timestamptz;
begin
  if p_scope not in (
    'submission_init_request',
    'submission_init',
    'public_analytics'
  )
    or p_ip_hash !~ '^v1:[a-f0-9]{64}$'
    or p_limit < 1
    or p_limit > 1000
    or p_window_seconds < 60
    or p_window_seconds > 86400
  then
    raise exception using errcode = '22023', message = 'invalid_rate_limit_parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('autopost:rate:' || p_scope || ':' || p_ip_hash, 0)
  );

  -- Per-key cleanup reduces churn between scheduled global retention runs and
  -- never scans unrelated IP hashes.
  delete from public.rate_limit_events
  where scope = p_scope
    and ip_hash = p_ip_hash
    and created_at < v_now - interval '7 days';

  select count(*)::integer, min(created_at)
  into v_count, v_oldest
  from public.rate_limit_events
  where scope = p_scope
    and ip_hash = p_ip_hash
    and created_at >= v_now - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    allowed := false;
    retry_after_seconds := greatest(
      1,
      ceil(
        extract(
          epoch from (
            v_oldest + make_interval(secs => p_window_seconds) - v_now
          )
        )
      )::integer
    );
    current_count := v_count;
    return next;
    return;
  end if;

  insert into public.rate_limit_events (scope, ip_hash)
  values (p_scope, p_ip_hash);

  allowed := true;
  retry_after_seconds := 0;
  current_count := v_count + 1;
  return next;
end;
$$;

-- Creates a pending submission and all expected file records in one database
-- transaction. Every valid init call consumes the broad request scope before
-- idempotency lookup; only a genuinely new row consumes the stricter creation
-- scope. This prevents signed-upload URL replay from bypassing abuse controls.
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
    or jsonb_typeof(p_files) <> 'array'
  then
    raise exception using errcode = '22023', message = 'invalid_submission_parameters';
  end if;

  v_file_count := jsonb_array_length(p_files);
  if v_file_count < 5 or v_file_count > 15 then
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

-- Atomically claims stale, incomplete submissions before Storage cleanup. A
-- short claim lease makes crashed invocations retryable, while a UUID token
-- prevents an old/overlapping cron invocation from deleting a reclaimed row.
create or replace function public.claim_stale_submissions(
  p_stale_before timestamptz,
  p_batch_size integer
)
returns table (
  submission_id uuid,
  claim_token uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
begin
  if p_stale_before is null
    or p_stale_before > v_now - interval '1 hour'
    or p_batch_size < 1
    or p_batch_size > 100
  then
    raise exception using errcode = '22023', message = 'invalid_cleanup_parameters';
  end if;

  return query
  with candidates as (
    select candidate.id
    from public.submissions as candidate
    where candidate.upload_state in ('pending', 'failed')
      and candidate.created_at < p_stale_before
      and (
        candidate.cleanup_claimed_at is null
        or candidate.cleanup_claimed_at < v_now - interval '2 hours'
      )
    order by candidate.created_at
    for update skip locked
    limit p_batch_size
  ), claimed as (
    update public.submissions as submission
    set upload_state = 'failed',
        cleanup_claimed_at = v_now,
        cleanup_claim_token = pg_catalog.gen_random_uuid()
    from candidates
    where submission.id = candidates.id
    returning submission.id, submission.cleanup_claim_token
  )
  select claimed.id, claimed.cleanup_claim_token
  from claimed;
end;
$$;

create or replace function public.delete_claimed_submission(
  p_submission_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted boolean := false;
begin
  if p_submission_id is null or p_claim_token is null then
    raise exception using errcode = '22023', message = 'invalid_cleanup_claim';
  end if;

  delete from public.submissions
  where id = p_submission_id
    and upload_state = 'failed'
    and cleanup_claim_token = p_claim_token
  returning true into v_deleted;

  return coalesce(v_deleted, false);
end;
$$;

-- Global retention cleanup complements per-key opportunistic deletion. The
-- created_at index keeps this bounded by time even when attackers rotate IPs.
create or replace function public.cleanup_expired_rate_limit_events(
  p_expired_before timestamptz
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if p_expired_before is null or p_expired_before > statement_timestamp() then
    raise exception using errcode = '22023', message = 'invalid_rate_cleanup_cutoff';
  end if;

  delete from public.rate_limit_events
  where created_at < p_expired_before;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Finalizes intake only when the caller supplies a complete, exact set of
-- Storage-verified paths, sizes, and MIME types. The analytics conversion row
-- and completion state commit atomically.
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
    jsonb_build_object('photo_count', v_expected_count)
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

alter table public.submissions enable row level security;
alter table public.submissions force row level security;
alter table public.submission_files enable row level security;
alter table public.submission_files force row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_events force row level security;
alter table public.rate_limit_events enable row level security;
alter table public.rate_limit_events force row level security;

revoke all on table public.submissions from public, anon, authenticated;
revoke all on table public.submission_files from public, anon, authenticated;
revoke all on table public.analytics_events from public, anon, authenticated;
revoke all on table public.rate_limit_events from public, anon, authenticated;

grant select, insert, update, delete on table public.submissions to service_role;
grant select, insert, update, delete on table public.submission_files to service_role;
grant select, insert, update, delete on table public.analytics_events to service_role;
grant select, insert, delete on table public.rate_limit_events to service_role;
grant usage on schema public to service_role;

revoke execute on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, integer, text, text, text, text, boolean, jsonb
) from public, anon, authenticated;
revoke execute on function public.complete_submission(uuid, jsonb)
  from public, anon, authenticated;
revoke execute on function public.claim_stale_submissions(timestamptz, integer)
  from public, anon, authenticated;
revoke execute on function public.delete_claimed_submission(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.cleanup_expired_rate_limit_events(timestamptz)
  from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;
grant execute on function public.begin_submission(
  uuid, text, text, text, integer, integer, integer, text, text, text, smallint,
  numeric, integer, text, text, text, text, boolean, jsonb
) to service_role;
grant execute on function public.complete_submission(uuid, jsonb)
  to service_role;
grant execute on function public.claim_stale_submissions(timestamptz, integer)
  to service_role;
grant execute on function public.delete_claimed_submission(uuid, uuid)
  to service_role;
grant execute on function public.cleanup_expired_rate_limit_events(timestamptz)
  to service_role;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.record_submission_status_analytics()
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.set_updated_at() to service_role;
grant execute on function private.record_submission_status_analytics()
  to service_role;

comment on table public.rate_limit_events is
  'Hashed-IP rate-limit ledger shared by every serverless instance. Raw IP addresses are never stored.';
comment on column public.submissions.upload_state is
  'Pending rows are not fulfillment-ready. Only complete rows passed Storage verification.';

-- The application issues one-time signed upload tokens and time-limited admin
-- download URLs with the service role. No anon/authenticated storage policies
-- are created, so clients cannot browse or directly read this private bucket.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vehicle-uploads',
  'vehicle-uploads',
  false,
  12582912,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
