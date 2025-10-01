/*
# [Fix] Correct Credit Calculation for Cancellations
[This migration corrects the logic for calculating cancellation credits by explicitly handling timezones, ensuring the time difference between the cancellation and the reservation is calculated accurately.]

## Query Description: [This operation updates a database function to fix a bug in credit calculation. It ensures that cancellations made more than 24 hours in advance receive the correct 100% credit, which was previously being miscalculated due to timezone issues. No data is at risk, and the change is safe to apply.]

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function `public.handle_client_cancellation_final` will be replaced with a corrected version.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible performance impact.]
*/
create or replace function public.handle_client_cancellation_final(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva record;
  v_credit_to_add numeric := 0;
  v_hours_until numeric;
  v_policy_text text;
  v_aluno_id uuid;
  v_reservation_start_timestamptz timestamptz;
begin
  -- 1. Fetch the reservation and arena policy, ensuring the user is the owner
  select r.*, a.cancellation_policy into v_reserva
  from public.reservas r
  join public.arenas a on r.arena_id = a.id
  where r.id = p_reserva_id and r.profile_id = auth.uid();

  -- If no reservation is found for the current user, raise an error
  if v_reserva is null then
    raise exception 'Permissão negada ou reserva não encontrada.';
  end if;

  -- 2. Construct a timezone-aware timestamp for the reservation start.
  -- We assume the stored date/time is in 'America/Sao_Paulo' timezone. This is a common default for Brazil.
  v_reservation_start_timestamptz := (v_reserva.date + v_reserva.start_time) at time zone 'America/Sao_Paulo';

  -- Calculate hours until the reservation using timezone-aware timestamps.
  v_hours_until := extract(epoch from (v_reservation_start_timestamptz - now())) / 3600;

  -- 3. Determine credit based on the policy
  if v_hours_until >= 24 then
    v_credit_to_add := v_reserva.total_price;
    v_policy_text := 'Cancelamento com +24h';
  elsif v_hours_until >= 12 then
    v_credit_to_add := v_reserva.total_price * 0.5;
    v_policy_text := 'Cancelamento entre 12h e 24h';
  else
    v_credit_to_add := 0;
    v_policy_text := 'Cancelamento com <12h';
  end if;

  -- 4. Update reservation status
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;

  -- 5. Add credit if applicable
  if v_credit_to_add > 0 then
    -- Find the corresponding 'aluno' record for the user in that arena
    select id into v_aluno_id
    from public.alunos
    where profile_id = auth.uid() and arena_id = v_reserva.arena_id;

    -- If an aluno record exists, update credit
    if v_aluno_id is not null then
      -- Add credit to the aluno's balance
      update public.alunos
      set credit_balance = credit_balance + v_credit_to_add
      where id = v_aluno_id;

      -- Log the credit transaction
      insert into public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
      values (v_aluno_id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', v_policy_text || ' da reserva #' || substr(v_reserva.id::text, 1, 8), v_reserva.id, auth.uid());
    end if;
  end if;
end;
$$;
