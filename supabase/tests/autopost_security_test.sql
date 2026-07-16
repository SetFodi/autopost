begin;

create extension if not exists pgtap with schema extensions;

select plan(53);

select has_table(
  'public',
  'submissions',
  'the private submission ledger exists'
);

select has_column(
  'public',
  'submissions',
  'price_currency',
  'submissions record the explicit vehicle price currency'
);

select has_column(
  'public',
  'submissions',
  'seller_type',
  'submissions record campaign seller segmentation'
);

select has_column(
  'public',
  'submissions',
  'utm_source',
  'submissions record UTM source'
);

select has_column(
  'public',
  'submissions',
  'utm_medium',
  'submissions record UTM medium'
);

select has_column(
  'public',
  'submissions',
  'utm_campaign',
  'submissions record UTM campaign'
);

select has_column(
  'public',
  'submissions',
  'utm_content',
  'submissions record UTM content'
);

select has_column(
  'public',
  'submissions',
  'utm_term',
  'submissions record UTM term'
);

select has_table(
  'public',
  'rate_limit_events',
  'the database-backed rate-limit ledger exists'
);

select has_table('public', 'fulfillments', 'the fulfillment ledger exists');

select has_table(
  'public',
  'generated_assets',
  'the generated-asset ledger exists'
);

select has_table('public', 'payments', 'the verified payment ledger exists');

select has_table(
  'private',
  'deleted_submission_tombstones',
  'delayed deletion tombstones exist'
);

select has_function(
  'public',
  'queue_fulfillment',
  array['uuid'],
  'the atomic preview workflow reservation exists'
);

select has_function(
  'public',
  'confirm_tbc_payment',
  array['text', 'text', 'numeric', 'text', 'text', 'jsonb', 'text'],
  'the atomic verified-payment transition exists'
);

select ok(
  not pg_catalog.has_table_privilege(
    'anon',
    'private.deleted_submission_tombstones',
    'select'
  ),
  'anonymous clients cannot read deletion tombstones'
);

select has_function(
  'public',
  'consume_rate_limit',
  array['text', 'text', 'integer', 'integer'],
  'the atomic rate-limit function exists'
);

select has_function(
  'public',
  'begin_submission',
  array[
    'uuid', 'text', 'text', 'text', 'integer', 'integer', 'integer', 'text',
    'text', 'text', 'text', 'smallint', 'numeric', 'text', 'integer', 'text',
    'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'boolean',
    'jsonb'
  ],
  'the canonical intake function requires seller segmentation and attribution'
);

select is(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.submissions'::regclass
  ),
  true,
  'RLS is enabled on submissions'
);

select is(
  (
    select relforcerowsecurity
    from pg_catalog.pg_class
    where oid = 'public.submissions'::regclass
  ),
  true,
  'RLS is forced on submissions'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'public.submissions', 'select'),
  'anon cannot list submissions'
);

select ok(
  not pg_catalog.has_table_privilege(
    'authenticated',
    'public.submissions',
    'select'
  ),
  'ordinary authenticated users cannot list submissions'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.consume_rate_limit(text,text,integer,integer)',
    'execute'
  ),
  'anon cannot call the rate-limit RPC directly'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.submissions',
      'public.submission_files',
      'public.analytics_events',
      'public.rate_limit_events',
      'public.fulfillments',
      'public.generated_assets',
      'public.payments'
    ]) as protected(table_name)
    where pg_catalog.has_table_privilege('anon', protected.table_name, 'select')
      or pg_catalog.has_table_privilege('anon', protected.table_name, 'insert')
      or pg_catalog.has_table_privilege('anon', protected.table_name, 'update')
      or pg_catalog.has_table_privilege('anon', protected.table_name, 'delete')
  ),
  'anon has no read or write privilege on any application table'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.submissions',
      'public.submission_files',
      'public.analytics_events',
      'public.rate_limit_events',
      'public.fulfillments',
      'public.generated_assets',
      'public.payments'
    ]) as protected(table_name)
    where pg_catalog.has_table_privilege('authenticated', protected.table_name, 'select')
      or pg_catalog.has_table_privilege('authenticated', protected.table_name, 'insert')
      or pg_catalog.has_table_privilege('authenticated', protected.table_name, 'update')
      or pg_catalog.has_table_privilege('authenticated', protected.table_name, 'delete')
  ),
  'ordinary authenticated users have no application-table privileges'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.begin_submission(uuid,text,text,text,integer,integer,integer,text,text,text,text,smallint,numeric,text,integer,text,text,text,text,text,text,text,text,text,boolean,jsonb)',
      'public.complete_submission(uuid,jsonb)',
      'public.claim_stale_submissions(timestamptz,integer)',
      'public.delete_claimed_submission(uuid,uuid)',
      'public.cleanup_expired_rate_limit_events(timestamptz)',
      'public.queue_fulfillment(uuid)',
      'public.confirm_tbc_payment(text,text,numeric,text,text,jsonb,text)',
      'public.create_submission_deletion_tombstone(uuid)',
      'public.claim_due_deletion_tombstones(integer)',
      'public.delete_claimed_deletion_tombstone(uuid,uuid)'
    ]) as protected(signature)
    where pg_catalog.has_function_privilege('anon', protected.signature, 'execute')
  ),
  'anon cannot execute intake, completion, or cleanup RPCs'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.begin_submission(uuid,text,text,text,integer,integer,integer,text,text,text,text,smallint,numeric,text,integer,text,text,text,text,text,text,text,text,text,boolean,jsonb)',
      'public.complete_submission(uuid,jsonb)',
      'public.claim_stale_submissions(timestamptz,integer)',
      'public.delete_claimed_submission(uuid,uuid)',
      'public.cleanup_expired_rate_limit_events(timestamptz)',
      'public.queue_fulfillment(uuid)',
      'public.confirm_tbc_payment(text,text,numeric,text,text,jsonb,text)',
      'public.create_submission_deletion_tombstone(uuid)',
      'public.claim_due_deletion_tombstones(integer)',
      'public.delete_claimed_deletion_tombstone(uuid,uuid)'
    ]) as protected(signature)
    where pg_catalog.has_function_privilege('authenticated', protected.signature, 'execute')
  ),
  'ordinary authenticated users cannot execute privileged RPCs'
);

select is(
  (
    select public
    from storage.buckets
    where id = 'vehicle-uploads'
  ),
  false,
  'vehicle-uploads is private'
);

select is(
  (
    select public
    from storage.buckets
    where id = 'vehicle-generated'
  ),
  false,
  'vehicle-generated is private'
);

select is(
  (
    select file_size_limit
    from storage.buckets
    where id = 'vehicle-generated'
  ),
  134217728::bigint,
  'generated deliverables have a bounded 128 MiB object limit'
);

select is(
  (
    select allowed
    from public.consume_rate_limit(
      'submission_init',
      'v1:' || repeat('a', 64),
      1,
      3600
    )
  ),
  true,
  'the first request consumes the persisted rate-limit slot'
);

select is(
  (
    select allowed
    from public.consume_rate_limit(
      'submission_init',
      'v1:' || repeat('a', 64),
      1,
      3600
    )
  ),
  false,
  'the next request from the same IP hash is blocked'
);

select is(
  (
    select count(*)::integer
    from public.rate_limit_events
    where scope = 'submission_init'
      and ip_hash = 'v1:' || repeat('a', 64)
  ),
  1,
  'a rejected request does not consume another slot'
);

select cmp_ok(
  (
    select retry_after_seconds
    from public.consume_rate_limit(
      'submission_init',
      'v1:' || repeat('a', 64),
      1,
      3600
    )
  ),
  '>',
  0,
  'a blocked request receives a positive retry delay'
);

insert into public.submissions (
  phone,
  seller_type,
  vehicle_model,
  vehicle_year,
  price,
  price_currency,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  status,
  upload_state,
  expected_file_count,
  consent_given,
  idempotency_key_hash,
  request_fingerprint,
  completed_at
)
values (
  '+995555123456',
  'dealer',
  'AutoPost lifecycle test',
  2021,
  24900,
  'GEL',
  'facebook',
  'paid_social',
  'campaign-validation',
  'feed-a',
  'cars',
  'new',
  'complete',
  3,
  true,
  'v1:' || repeat('b', 64),
  'v1:' || repeat('c', 64),
  now()
);

select throws_like(
  $$
    update public.submissions
    set seller_type = 'broker'
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_seller_type_check%',
  'seller type is limited to the agreed campaign segments'
);

select throws_like(
  $$
    update public.submissions
    set utm_source = repeat('x', 201)
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_utm_source_length_check%',
  'UTM values are bounded at the database boundary'
);

select throws_like(
  $$
    update public.submissions
    set status = 'delivered'
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_delivery_prerequisite_check%',
  'delivered requires a saved delivery URL at the database boundary'
);

select throws_like(
  $$
    update public.submissions
    set price_currency = 'EUR'
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_price_currency_check%',
  'vehicle price currency is limited to GEL and USD'
);

select throws_like(
  $$
    update public.submissions
    set status = 'converted',
        delivery_url = 'https://example.com/autopost-preview',
        amount_paid = 14.90
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_conversion_delivery_check%',
  'conversion cannot skip the delivered lifecycle state'
);

update public.submissions
set status = 'delivered',
    delivery_url = 'https://example.com/autopost-preview'
where idempotency_key_hash = 'v1:' || repeat('b', 64);

select ok(
  (
    select delivered_at is not null
    from public.submissions
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  ),
  'delivered status records its timestamp'
);

select is(
  (
    select count(*)::integer
    from public.analytics_events
    where event_name = 'preview_delivered'
      and submission_id = (
        select id
        from public.submissions
        where idempotency_key_hash = 'v1:' || repeat('b', 64)
      )
  ),
  1,
  'delivered status records exactly one lifecycle event'
);

select ok(
  (
    select metadata @> jsonb_build_object(
      'seller_type', 'dealer',
      'utm_source', 'facebook',
      'utm_campaign', 'campaign-validation'
    )
    from public.analytics_events
    where event_name = 'preview_delivered'
      and submission_id = (
        select id
        from public.submissions
        where idempotency_key_hash = 'v1:' || repeat('b', 64)
      )
  ),
  'delivered analytics retain seller and campaign attribution'
);

update public.submissions
set status = 'delivered'
where idempotency_key_hash = 'v1:' || repeat('b', 64);

select is(
  (
    select count(*)::integer
    from public.analytics_events
    where event_name = 'preview_delivered'
      and submission_id = (
        select id
        from public.submissions
        where idempotency_key_hash = 'v1:' || repeat('b', 64)
      )
  ),
  1,
  'repeating delivered status does not duplicate its lifecycle event'
);

select throws_like(
  $$
    update public.submissions
    set status = 'converted'
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  $$,
  '%submissions_conversion_prerequisite_check%',
  'converted requires a positive paid amount at the database boundary'
);

update public.submissions
set status = 'converted',
    amount_paid = 14.90
where idempotency_key_hash = 'v1:' || repeat('b', 64);

select ok(
  (
    select converted_at is not null
    from public.submissions
    where idempotency_key_hash = 'v1:' || repeat('b', 64)
  ),
  'converted status records its timestamp'
);

select is(
  (
    select count(*)::integer
    from public.analytics_events
    where event_name = 'converted'
      and submission_id = (
        select id
        from public.submissions
        where idempotency_key_hash = 'v1:' || repeat('b', 64)
      )
  ),
  1,
  'converted status records exactly one lifecycle event'
);

select ok(
  (
    select metadata @> jsonb_build_object(
      'seller_type', 'dealer',
      'utm_medium', 'paid_social',
      'utm_content', 'feed-a'
    )
    from public.analytics_events
    where event_name = 'converted'
      and submission_id = (
        select id
        from public.submissions
        where idempotency_key_hash = 'v1:' || repeat('b', 64)
      )
  ),
  'converted analytics retain seller and campaign attribution'
);

insert into public.submissions (
  id,
  phone,
  seller_type,
  vehicle_model,
  vehicle_year,
  price,
  price_currency,
  utm_source,
  utm_medium,
  utm_campaign,
  expected_file_count,
  consent_given,
  idempotency_key_hash,
  request_fingerprint
)
values (
  '80000000-0000-4000-8000-000000000001',
  '+995555800001',
  'private_seller',
  'Three photo completion test',
  2024,
  15000,
  'GEL',
  'instagram',
  'paid_social',
  'campaign-validation',
  3,
  true,
  'v1:' || repeat('d', 64),
  'v1:' || repeat('e', 64)
);

insert into public.submission_files (
  submission_id,
  storage_path,
  original_filename,
  mime_type,
  file_size,
  sort_order
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    'submissions/80000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.jpg',
    'one.jpg',
    'image/jpeg',
    123,
    0
  ),
  (
    '80000000-0000-4000-8000-000000000001',
    'submissions/80000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222.jpg',
    'two.jpg',
    'image/jpeg',
    123,
    1
  ),
  (
    '80000000-0000-4000-8000-000000000001',
    'submissions/80000000-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333.jpg',
    'three.jpg',
    'image/jpeg',
    123,
    2
  );

select lives_ok(
  $$
    select *
    from public.complete_submission(
      '80000000-0000-4000-8000-000000000001',
      jsonb_build_array(
        jsonb_build_object(
          'path',
          'submissions/80000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.jpg',
          'fileSize',
          123,
          'mimeType',
          'image/jpeg'
        ),
        jsonb_build_object(
          'path',
          'submissions/80000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222.jpg',
          'fileSize',
          123,
          'mimeType',
          'image/jpeg'
        ),
        jsonb_build_object(
          'path',
          'submissions/80000000-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333.jpg',
          'fileSize',
          123,
          'mimeType',
          'image/jpeg'
        )
      )
    )
  $$,
  'a three-photo submission can complete atomically'
);

select ok(
  (
    select metadata @> jsonb_build_object(
      'photo_count', 3,
      'seller_type', 'private_seller',
      'utm_source', 'instagram',
      'utm_campaign', 'campaign-validation'
    )
    from public.analytics_events
    where submission_id = '80000000-0000-4000-8000-000000000001'
      and event_name = 'submission_completed'
  ),
  'completion analytics retain the three-photo count and campaign attribution'
);

insert into public.submissions (
  id,
  phone,
  seller_type,
  vehicle_model,
  vehicle_year,
  price,
  price_currency,
  status,
  upload_state,
  expected_file_count,
  consent_given,
  idempotency_key_hash,
  request_fingerprint,
  completed_at
)
values (
  '80000000-0000-4000-8000-000000000002',
  '+995555800002',
  'dealer',
  'TBC delivery transition test',
  2025,
  32000,
  'GEL',
  'preview_ready',
  'complete',
  3,
  true,
  'v1:' || repeat('f', 64),
  'v1:' || repeat('0', 64),
  now()
);

insert into public.fulfillments (submission_id)
values ('80000000-0000-4000-8000-000000000002');

insert into public.payments (
  submission_id,
  merchant_payment_id,
  provider_payment_id,
  amount,
  currency
)
values (
  '80000000-0000-4000-8000-000000000002',
  'APABCDEF1234-ABCDEF123456',
  'pay-campaign-001',
  14.90,
  'GEL'
);

select lives_ok(
  $$
    select *
    from public.confirm_tbc_payment(
      'pay-campaign-001',
      'Succeeded',
      14.90,
      'GEL',
      'Approved',
      '{"status":"Succeeded"}'::jsonb,
      'https://autopost.test/result/80000000-0000-4000-8000-000000000002'
    )
  $$,
  'a verified TBC success records delivery before conversion'
);

select is(
  (
    select status
    from public.submissions
    where id = '80000000-0000-4000-8000-000000000002'
  ),
  'converted',
  'the verified TBC payment leaves the submission converted'
);

select ok(
  (
    select delivered_at is not null and converted_at is not null
    from public.submissions
    where id = '80000000-0000-4000-8000-000000000002'
  ),
  'the verified TBC transition records both lifecycle timestamps'
);

select is(
  (
    select count(*)::integer
    from public.analytics_events
    where submission_id = '80000000-0000-4000-8000-000000000002'
      and event_name in ('preview_delivered', 'converted')
  ),
  2,
  'the verified TBC transition records delivery and conversion analytics'
);

select * from finish();
rollback;
