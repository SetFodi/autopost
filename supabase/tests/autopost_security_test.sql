begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

select has_table(
  'public',
  'submissions',
  'the private submission ledger exists'
);

select has_table(
  'public',
  'rate_limit_events',
  'the database-backed rate-limit ledger exists'
);

select has_function(
  'public',
  'consume_rate_limit',
  array['text', 'text', 'integer', 'integer'],
  'the atomic rate-limit function exists'
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
      'public.rate_limit_events'
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
      'public.rate_limit_events'
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
      'public.begin_submission(uuid,text,text,text,integer,integer,integer,text,text,text,smallint,numeric,integer,text,text,text,text,boolean,jsonb)',
      'public.complete_submission(uuid,jsonb)',
      'public.claim_stale_submissions(timestamptz,integer)',
      'public.delete_claimed_submission(uuid,uuid)',
      'public.cleanup_expired_rate_limit_events(timestamptz)'
    ]) as protected(signature)
    where pg_catalog.has_function_privilege('anon', protected.signature, 'execute')
  ),
  'anon cannot execute intake, completion, or cleanup RPCs'
);

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.begin_submission(uuid,text,text,text,integer,integer,integer,text,text,text,smallint,numeric,integer,text,text,text,text,boolean,jsonb)',
      'public.complete_submission(uuid,jsonb)',
      'public.claim_stale_submissions(timestamptz,integer)',
      'public.delete_claimed_submission(uuid,uuid)',
      'public.cleanup_expired_rate_limit_events(timestamptz)'
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
  vehicle_model,
  vehicle_year,
  price,
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
  'AutoPost lifecycle test',
  2021,
  24900,
  'new',
  'complete',
  5,
  true,
  'v1:' || repeat('b', 64),
  'v1:' || repeat('c', 64),
  now()
);

update public.submissions
set status = 'delivered'
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

update public.submissions
set status = 'converted'
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

select * from finish();
rollback;
