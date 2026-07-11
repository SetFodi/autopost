-- Keep a safety margin below the Supabase Free plan's 1 GB file-storage
-- allowance. Completed submissions reserve their verified declared bytes;
-- incomplete submissions reserve the bucket maximum for every expected object
-- so a forged small client-side size cannot bypass the guard.
create table private.intake_capacity_config (
  bucket_id text primary key,
  max_reserved_bytes bigint not null,

  constraint intake_capacity_config_bucket_check
    check (bucket_id = 'vehicle-uploads'),
  constraint intake_capacity_config_max_bytes_check
    check (max_reserved_bytes between 67108864 and 1125899906842624)
);

insert into private.intake_capacity_config (bucket_id, max_reserved_bytes)
values ('vehicle-uploads', 805306368);

alter table private.intake_capacity_config enable row level security;
alter table private.intake_capacity_config force row level security;

revoke all on table private.intake_capacity_config
  from public, anon, authenticated;
grant select on table private.intake_capacity_config to service_role;

create or replace function private.enforce_intake_capacity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max_reserved_bytes bigint;
  v_reserved_bytes bigint;
  v_new_reserved_bytes bigint;
  v_upload_state text;
begin
  -- One transaction-scoped lock serializes capacity checks and file-row
  -- creation across all Vercel instances. The lock is held only for the
  -- surrounding begin_submission database transaction.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'autopost:intake-capacity:vehicle-uploads',
      0
    )
  );

  select config.max_reserved_bytes
  into v_max_reserved_bytes
  from private.intake_capacity_config as config
  where config.bucket_id = 'vehicle-uploads';

  if v_max_reserved_bytes is null then
    raise exception using
      errcode = 'P0001',
      message = 'intake_capacity_configuration_missing';
  end if;

  select submission.upload_state
  into v_upload_state
  from public.submissions as submission
  where submission.id = new.submission_id;

  if v_upload_state is null then
    raise exception using
      errcode = '23503',
      message = 'submission_not_found_for_capacity_check';
  end if;

  -- Pending and failed rows can hold an object as large as the bucket allows,
  -- regardless of the browser-declared size. Completed rows have already
  -- passed server-side Storage size verification, so their metadata is safe
  -- to use as the continuing reservation.
  v_new_reserved_bytes := case
    when v_upload_state = 'complete' then new.file_size
    else 12582912
  end;

  if tg_op = 'UPDATE' then
    select coalesce(
      sum(
        case
          when submission.upload_state = 'complete' then file.file_size
          else 12582912
        end
      ),
      0
    )::bigint
    into v_reserved_bytes
    from public.submission_files as file
    join public.submissions as submission on submission.id = file.submission_id
    where file.id <> old.id;
  else
    select coalesce(
      sum(
        case
          when submission.upload_state = 'complete' then file.file_size
          else 12582912
        end
      ),
      0
    )::bigint
    into v_reserved_bytes
    from public.submission_files as file
    join public.submissions as submission on submission.id = file.submission_id;
  end if;

  if v_reserved_bytes + v_new_reserved_bytes > v_max_reserved_bytes then
    raise exception using
      errcode = 'P0001',
      message = 'intake_capacity_exceeded';
  end if;

  return new;
end;
$$;

create trigger submission_files_enforce_intake_capacity
before insert or update of submission_id, file_size
on public.submission_files
for each row execute function private.enforce_intake_capacity();

revoke execute on function private.enforce_intake_capacity()
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.enforce_intake_capacity() to service_role;

comment on table private.intake_capacity_config is
  'Global file-intake safety limit. Raise max_reserved_bytes deliberately after upgrading Storage capacity.';
comment on function private.enforce_intake_capacity() is
  'Atomically reserves Storage capacity from submission file metadata before signed upload URLs are issued.';
