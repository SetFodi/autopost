-- Repair databases where the campaign conversion-delivery constraint was
-- applied after the original payment RPC. A verified TBC success now records
-- delivered and converted as two ordered transitions in one transaction.
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

revoke execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.confirm_tbc_payment(
  text, text, numeric, text, text, jsonb, text
) to service_role;
