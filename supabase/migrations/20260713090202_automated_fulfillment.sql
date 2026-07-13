-- Durable, hands-off fulfillment and payment state for AutoPost.
-- Every table remains private to the service role. Customer access is through
-- server-side, signed result URLs; TBC callbacks are verified before these
-- rows are mutated.

-- Generated files use a separate private bucket. Keeping source uploads in the
-- original 12 MiB image-only bucket prevents a signed public upload token from
-- being abused to write a large video or archive.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vehicle-generated',
  'vehicle-generated',
  false,
  134217728,
  array[
    'image/png',
    'text/plain',
    'video/mp4',
    'application/zip'
  ]::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Both buckets share the project Storage quota. Reserve at least half of a
-- Free project's first GiB for generated previews and paid packages.
update private.intake_capacity_config
set max_reserved_bytes = least(max_reserved_bytes, 536870912)
where bucket_id = 'vehicle-uploads';

create table public.fulfillments (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  status text not null default 'queued',
  preview_workflow_run_id text,
  paid_workflow_run_id text,
  preview_started_at timestamptz,
  preview_ready_at timestamptz,
  paid_started_at timestamptz,
  ready_at timestamptz,
  failed_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fulfillments_status_check
    check (
      status in (
        'queued',
        'generating_preview',
        'preview_ready',
        'generating_paid',
        'ready',
        'failed'
      )
    ),
  constraint fulfillments_preview_run_length_check
    check (
      preview_workflow_run_id is null
      or char_length(preview_workflow_run_id) between 3 and 255
    ),
  constraint fulfillments_paid_run_length_check
    check (
      paid_workflow_run_id is null
      or char_length(paid_workflow_run_id) between 3 and 255
    ),
  constraint fulfillments_error_code_check
    check (
      last_error_code is null
      or last_error_code ~ '^[a-z0-9_]{3,80}$'
    )
);

create table public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  access_tier text not null,
  asset_kind text not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint generated_assets_submission_tier_kind_key
    unique (submission_id, access_tier, asset_kind),
  constraint generated_assets_storage_path_key unique (storage_path),
  constraint generated_assets_access_tier_check
    check (access_tier in ('preview', 'paid')),
  constraint generated_assets_kind_check
    check (
      asset_kind in (
        'square',
        'story_1',
        'story_2',
        'story_3',
        'carousel_1',
        'carousel_2',
        'carousel_3',
        'carousel_4',
        'carousel_5',
        'carousel_6',
        'copy',
        'reel',
        'package'
      )
    ),
  constraint generated_assets_path_check
    check (
      storage_path ~ (
        '^generated/' || submission_id::text ||
        '/(preview|paid)/(square|story_[123]|carousel_[1-6]|copy|reel|package)' ||
        '\.(png|txt|mp4|zip)$'
      )
    ),
  constraint generated_assets_filename_check
    check (
      char_length(filename) between 1 and 160
      and filename !~ '[/\\]'
    ),
  constraint generated_assets_mime_type_check
    check (
      mime_type in (
        'image/png',
        'text/plain; charset=utf-8',
        'video/mp4',
        'application/zip'
      )
    ),
  constraint generated_assets_file_size_check
    check (file_size between 1 and 134217728)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  provider text not null default 'tbc',
  merchant_payment_id text not null,
  provider_payment_id text,
  status text not null default 'created',
  amount numeric(12, 2) not null,
  currency text not null,
  checkout_url text,
  provider_result_code text,
  verified_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_merchant_payment_id_key unique (merchant_payment_id),
  constraint payments_provider_payment_id_key unique (provider_payment_id),
  constraint payments_provider_check check (provider = 'tbc'),
  constraint payments_merchant_payment_id_check
    check (merchant_payment_id ~ '^AP[A-F0-9]{10}-[A-F0-9]{12}$'),
  constraint payments_provider_payment_id_check
    check (
      provider_payment_id is null
      or char_length(provider_payment_id) between 3 and 120
    ),
  constraint payments_status_check
    check (
      status in (
        'created',
        'processing',
        'succeeded',
        'failed',
        'expired',
        'returned',
        'cancelled'
      )
    ),
  constraint payments_amount_check check (amount = 14.90),
  constraint payments_currency_check check (currency = 'GEL'),
  constraint payments_checkout_url_check
    check (
      checkout_url is null
      or (
        char_length(checkout_url) <= 2048
        and checkout_url ~ '^https://tpay\.tbcbank\.ge/'
      )
    ),
  constraint payments_result_code_check
    check (
      provider_result_code is null
      or char_length(provider_result_code) <= 120
    ),
  constraint payments_payload_object_check
    check (jsonb_typeof(verified_payload) = 'object'),
  constraint payments_payload_size_check
    check (pg_column_size(verified_payload) <= 16384),
  constraint payments_paid_state_check
    check (
      (status = 'succeeded' and paid_at is not null)
      or (status <> 'succeeded' and paid_at is null)
    )
);

create table private.deleted_submission_tombstones (
  submission_id uuid primary key,
  storage_prefix text not null,
  delete_after timestamptz not null,
  claim_token uuid,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint deleted_submission_tombstones_prefix_check
    check (storage_prefix = 'submissions/' || submission_id::text || '/'),
  constraint deleted_submission_tombstones_claim_pair_check
    check (
      (claim_token is null and claimed_at is null)
      or (claim_token is not null and claimed_at is not null)
    )
);

create index fulfillments_status_updated_idx
  on public.fulfillments (status, updated_at);
create index generated_assets_submission_tier_idx
  on public.generated_assets (submission_id, access_tier, asset_kind);
create index payments_submission_created_idx
  on public.payments (submission_id, created_at desc);
create unique index payments_one_active_checkout_idx
  on public.payments (submission_id)
  where status in ('created', 'processing');
create index payments_status_updated_idx
  on public.payments (status, updated_at)
  where status in ('created', 'processing');
create index deleted_submission_tombstones_due_idx
  on private.deleted_submission_tombstones (delete_after)
  where claim_token is null;

create trigger fulfillments_set_updated_at
before update on public.fulfillments
for each row execute function private.set_updated_at();

create trigger generated_assets_set_updated_at
before update on public.generated_assets
for each row execute function private.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function private.set_updated_at();

create or replace function public.queue_fulfillment(p_submission_id uuid)
returns table (
  fulfillment_status text,
  should_start_preview boolean,
  preview_start_token text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_upload_state text;
  v_fulfillment public.fulfillments%rowtype;
begin
  if p_submission_id is null then
    raise exception using errcode = '22023', message = 'invalid_submission_id';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'autopost:fulfillment:queue:' || p_submission_id::text,
      0
    )
  );

  select upload_state
  into v_upload_state
  from public.submissions
  where id = p_submission_id;

  if v_upload_state is distinct from 'complete' then
    raise exception using errcode = 'P0001', message = 'submission_not_complete';
  end if;

  insert into public.fulfillments (submission_id)
  values (p_submission_id)
  on conflict (submission_id) do nothing;

  select *
  into v_fulfillment
  from public.fulfillments
  where submission_id = p_submission_id
  for update;

  should_start_preview :=
    v_fulfillment.preview_workflow_run_id is null
    and v_fulfillment.status in ('queued', 'generating_preview', 'failed');

  if should_start_preview then
    preview_start_token := 'starting:' || pg_catalog.gen_random_uuid()::text;
    update public.fulfillments
    set status = 'generating_preview',
        preview_workflow_run_id = preview_start_token,
        preview_started_at = statement_timestamp(),
        failed_at = null,
        last_error_code = null
    where submission_id = p_submission_id;
    fulfillment_status := 'generating_preview';
  else
    preview_start_token := null;
    fulfillment_status := v_fulfillment.status;
  end if;

  return next;
end;
$$;

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

  -- A confirmed success is monotonic. Later duplicate or stale provider
  -- messages cannot downgrade it.
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
    update public.submissions
    set amount_paid = v_payment.amount,
        delivery_url = p_delivery_url,
        status = 'converted'
    where id = v_payment.submission_id
      and upload_state = 'complete';

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

create or replace function public.create_submission_deletion_tombstone(
  p_submission_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_submission_id is null then
    raise exception using errcode = '22023', message = 'invalid_submission_id';
  end if;

  insert into private.deleted_submission_tombstones (
    submission_id,
    storage_prefix,
    delete_after
  )
  values (
    p_submission_id,
    'submissions/' || p_submission_id::text || '/',
    statement_timestamp() + interval '3 hours'
  )
  on conflict (submission_id) do update
  set delete_after = greatest(
        private.deleted_submission_tombstones.delete_after,
        excluded.delete_after
      ),
      claim_token = null,
      claimed_at = null;

  return true;
end;
$$;

create or replace function public.claim_due_deletion_tombstones(
  p_batch_size integer
)
returns table (
  submission_id uuid,
  storage_prefix text,
  claim_token uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
begin
  if p_batch_size < 1 or p_batch_size > 100 then
    raise exception using errcode = '22023', message = 'invalid_tombstone_batch';
  end if;

  return query
  with candidates as (
    select tombstone.submission_id
    from private.deleted_submission_tombstones as tombstone
    where tombstone.delete_after <= v_now
      and (
        tombstone.claimed_at is null
        or tombstone.claimed_at < v_now - interval '30 minutes'
      )
    order by tombstone.delete_after
    for update skip locked
    limit p_batch_size
  ), claimed as (
    update private.deleted_submission_tombstones as tombstone
    set claim_token = pg_catalog.gen_random_uuid(),
        claimed_at = v_now
    from candidates
    where tombstone.submission_id = candidates.submission_id
    returning tombstone.submission_id,
              tombstone.storage_prefix,
              tombstone.claim_token
  )
  select claimed.submission_id, claimed.storage_prefix, claimed.claim_token
  from claimed;
end;
$$;

create or replace function public.delete_claimed_deletion_tombstone(
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
  delete from private.deleted_submission_tombstones
  where submission_id = p_submission_id
    and claim_token = p_claim_token
  returning true into v_deleted;

  return coalesce(v_deleted, false);
end;
$$;

alter table public.fulfillments enable row level security;
alter table public.fulfillments force row level security;
alter table public.generated_assets enable row level security;
alter table public.generated_assets force row level security;
alter table public.payments enable row level security;
alter table public.payments force row level security;
alter table private.deleted_submission_tombstones enable row level security;
alter table private.deleted_submission_tombstones force row level security;

revoke all on table public.fulfillments from public, anon, authenticated;
revoke all on table public.generated_assets from public, anon, authenticated;
revoke all on table public.payments from public, anon, authenticated;
revoke all on table private.deleted_submission_tombstones
  from public, anon, authenticated;

grant select, insert, update, delete on table public.fulfillments to service_role;
grant select, insert, update, delete on table public.generated_assets to service_role;
grant select, insert, update, delete on table public.payments to service_role;
grant select, insert, update, delete
  on table private.deleted_submission_tombstones to service_role;

revoke execute on function public.queue_fulfillment(uuid)
  from public, anon, authenticated;
revoke execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) from public, anon, authenticated;
revoke execute on function public.create_submission_deletion_tombstone(uuid)
  from public, anon, authenticated;
revoke execute on function public.claim_due_deletion_tombstones(integer)
  from public, anon, authenticated;
revoke execute on function public.delete_claimed_deletion_tombstone(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.queue_fulfillment(uuid) to service_role;
grant execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) to service_role;
grant execute on function public.create_submission_deletion_tombstone(uuid)
  to service_role;
grant execute on function public.claim_due_deletion_tombstones(integer)
  to service_role;
grant execute on function public.delete_claimed_deletion_tombstone(uuid, uuid)
  to service_role;

comment on table public.fulfillments is
  'Durable preview and paid-package generation state for one completed submission.';
comment on table public.generated_assets is
  'Private generated media. Customer downloads are issued as short-lived signed URLs by the server.';
comment on table public.payments is
  'TBC Checkout attempts verified server-to-server before any paid asset is unlocked.';
comment on table private.deleted_submission_tombstones is
  'Delayed re-cleanup after deletion so still-valid signed upload tokens cannot recreate retained objects.';
