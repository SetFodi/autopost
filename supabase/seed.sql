-- DEVELOPMENT ONLY. These rows populate the private admin dashboard after a
-- local `supabase db reset`. Never run this file against production.
-- Photo objects are intentionally not fabricated; use the real public upload
-- flow when testing the signed-photo gallery.

insert into public.submissions (
  id,
  public_reference,
  phone,
  customer_name,
  vehicle_model,
  vehicle_year,
  price,
  mileage,
  engine,
  transmission,
  location,
  status,
  upload_state,
  expected_file_count,
  consent_given,
  internal_notes,
  delivery_url,
  amount_paid,
  delivered_at,
  converted_at,
  completed_at,
  idempotency_key_hash,
  request_fingerprint,
  created_at
)
values
  (
    '10000000-0000-4000-8000-000000000001', 'AP-DE00000001',
    '+995555000001', 'DEV Seed', 'DEV · BMW 330i', 2021, 24900, 85000,
    '2.0 Turbo', 'ავტომატიკა', 'თბილისი', 'new', 'complete', 5, true,
    'Development-only dashboard row. No storage objects are attached.', null,
    0, null, null, now() - interval '6 hours',
    'v1:' || repeat('1', 64), 'v1:' || repeat('a', 64),
    now() - interval '6 hours'
  ),
  (
    '10000000-0000-4000-8000-000000000002', 'AP-DE00000002',
    '+995555000002', 'DEV Seed', 'DEV · Toyota RAV4', 2020, 21800, 94000,
    '2.5 Hybrid', 'ავტომატიკა', 'ბათუმი', 'in_progress', 'complete', 5, true,
    'Development-only in-progress example.', null, 0, null, null,
    now() - interval '1 day', 'v1:' || repeat('2', 64),
    'v1:' || repeat('b', 64), now() - interval '1 day'
  ),
  (
    '10000000-0000-4000-8000-000000000003', 'AP-DE00000003',
    '+995555000003', 'DEV Seed', 'DEV · Mercedes-Benz GLE 450', 2022, 62500,
    43000, '3.0', 'ავტომატიკა', 'თბილისი', 'preview_ready', 'complete', 5,
    true, 'Development-only Preview-ready example.',
    'https://example.com/development-preview', 0, null, null,
    now() - interval '2 days', 'v1:' || repeat('3', 64),
    'v1:' || repeat('c', 64), now() - interval '2 days'
  ),
  (
    '10000000-0000-4000-8000-000000000004', 'AP-DE00000004',
    '+995555000004', 'DEV Seed', 'DEV · Ford Mustang', 2019, 37500, 51000,
    '5.0', 'ავტომატიკა', 'ქუთაისი', 'delivered', 'complete', 5, true,
    'Development-only delivered example.',
    'https://example.com/development-preview', 0, now() - interval '2 days',
    null, now() - interval '3 days', 'v1:' || repeat('4', 64),
    'v1:' || repeat('d', 64), now() - interval '3 days'
  ),
  (
    '10000000-0000-4000-8000-000000000005', 'AP-DE00000005',
    '+995555000005', 'DEV Seed', 'DEV · Porsche Macan S', 2021, 68900, 37000,
    '2.9', 'ავტომატიკა', 'თბილისი', 'converted', 'complete', 5, true,
    'Development-only converted example.',
    'https://example.com/development-preview', 14.90,
    now() - interval '4 days', now() - interval '3 days',
    now() - interval '5 days', 'v1:' || repeat('5', 64),
    'v1:' || repeat('e', 64), now() - interval '5 days'
  ),
  (
    '10000000-0000-4000-8000-000000000006', 'AP-DE00000006',
    '+995555000006', 'DEV Seed', 'DEV · Honda CR-V', 2018, 17900, 112000,
    '2.4', 'ავტომატიკა', 'რუსთავი', 'rejected', 'complete', 5, true,
    'Development-only rejected example.', null, 0, null, null,
    now() - interval '7 days', 'v1:' || repeat('6', 64),
    'v1:' || repeat('f', 64), now() - interval '7 days'
  )
on conflict (id) do nothing;
