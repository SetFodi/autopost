begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

select has_table(
  'private',
  'intake_capacity_config',
  'the private global intake-capacity configuration exists'
);

select has_trigger(
  'public',
  'submission_files',
  'submission_files_enforce_intake_capacity',
  'submission files enforce the global capacity reservation'
);

select is(
  (
    select max_reserved_bytes
    from private.intake_capacity_config
    where bucket_id = 'vehicle-uploads'
  ),
  805306368::bigint,
  'the default leaves headroom below the Free Storage quota'
);

select ok(
  not pg_catalog.has_table_privilege(
    'anon',
    'private.intake_capacity_config',
    'select'
  ),
  'anonymous clients cannot read capacity configuration'
);

update private.intake_capacity_config
set max_reserved_bytes = 67108864
where bucket_id = 'vehicle-uploads';

insert into public.submissions (
  id,
  phone,
  vehicle_model,
  vehicle_year,
  price,
  price_currency,
  expected_file_count,
  consent_given,
  idempotency_key_hash,
  request_fingerprint
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '+995555700001',
    'Capacity test one',
    2024,
    10000,
    'GEL',
    5,
    true,
    'v1:' || repeat('7', 64),
    'v1:' || repeat('a', 64)
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '+995555700002',
    'Capacity test two',
    2024,
    10000,
    'GEL',
    5,
    true,
    'v1:' || repeat('8', 64),
    'v1:' || repeat('b', 64)
  );

insert into public.submission_files (
  submission_id,
  storage_path,
  original_filename,
  mime_type,
  file_size,
  sort_order
)
select
  '70000000-0000-4000-8000-000000000001',
  'submissions/70000000-0000-4000-8000-000000000001/' ||
    pg_catalog.gen_random_uuid()::text || '.jpg',
  'capacity-' || file_index || '.jpg',
  'image/jpeg',
  1,
  file_index
from generate_series(0, 4) as file_index;

select throws_ok(
  $$
    insert into public.submission_files (
      submission_id,
      storage_path,
      original_filename,
      mime_type,
      file_size,
      sort_order
    )
    values (
      '70000000-0000-4000-8000-000000000002',
      'submissions/70000000-0000-4000-8000-000000000002/' ||
        pg_catalog.gen_random_uuid()::text || '.jpg',
      'blocked.jpg',
      'image/jpeg',
      1,
      0
    )
  $$,
  'P0001',
  'intake_capacity_exceeded',
  'pending objects reserve the bucket maximum and cannot overfill capacity'
);

select * from finish();
rollback;
