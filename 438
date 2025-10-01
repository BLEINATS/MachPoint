/*
# [Fix] Correct Function Return Type
[This migration corrects the return type of the `handle_client_cancellation_final` function to resolve a database error.]

## Query Description: [This script addresses a "cannot change return type" error by first dropping the outdated version of the `handle_client_cancellation_final` function and then recreating it with the correct `json` return type. This change is necessary for the function to work as expected and does not affect any existing data. It's a safe structural fix.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops function: `handle_client_cancellation_final(uuid)`
- Recreates function: `handle_client_cancellation_final(uuid)` with the correct return type.

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Invoker]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/

-- Step 1: Drop the existing function that has the wrong return type.
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

-- Step 2: Recreate the function with the correct definition and return type.
create or replace function public.handle_client_cancellation_final(p_reserva_id uuid)
returns json as $$
declare
  v_reserva record;
  v_aluno record;
  v_credit_to_return numeric := 0;
  v_policy_hours_full_refund int := 24;
  v_policy_hours_half_refund int := 12;
  v_hours_until_reservation int;
  v_policy_reason text;
begin
  -- 1. Fetch the reservation and lock it for update
  select * into v_reserva from public.reservas where id = p_reserva_id for update;

  -- 2. Check if reservation exists and belongs to the user
  if v_reserva is null then
    return json_build_object('success', false, 'message', 'Reserva não encontrada.');
  end if;

  if v_reserva.profile_id is null or v_reserva.profile_id <> auth.uid() then
    return json_build_object('success', false, 'message', 'Você não tem permissão para cancelar esta reserva.');
  end if;
  
  if v_reserva.status = 'cancelada' then
    return json_build_object('success', false, 'message', 'Esta reserva já foi cancelada.');
  end if;

  -- 3. Fetch the corresponding 'aluno' profile
  select * into v_aluno from public.alunos where profile_id = v_reserva.profile_id and arena_id = v_reserva.arena_id limit 1;

  if v_aluno is null then
    return json_build_object('success', false, 'message', 'Perfil de cliente não encontrado para esta arena.');
  end if;

  -- 4. Calculate credit return based on policy
  v_hours_until_reservation := extract(epoch from (v_reserva.date + v_reserva.start_time - now())) / 3600;

  if v_hours_until_reservation >= v_policy_hours_full_refund then
    v_credit_to_return := v_reserva.total_price;
    v_policy_reason := 'Cancelamento com +24h de antecedência';
  elsif v_hours_until_reservation >= v_policy_hours_half_refund then
    v_credit_to_return := v_reserva.total_price * 0.5;
    v_policy_reason := 'Cancelamento entre 12h e 24h';
  else
    v_credit_to_return := 0;
    v_policy_reason := 'Cancelamento com -12h de antecedência';
  end if;
  
  -- 5. Update reservation status
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;

  -- 6. Process credit return if applicable
  if v_credit_to_return > 0 then
    -- Add credit back to aluno profile
    update public.alunos
    set credit_balance = credit_balance + v_credit_to_return
    where id = v_aluno.id;

    -- Log the credit transaction
    insert into public.credit_transactions(aluno_id, arena_id, amount, type, description, related_reservation_id)
    values (v_aluno.id, v_reserva.arena_id, v_credit_to_return, 'cancellation_credit', v_policy_reason, p_reserva_id);
  end if;
  
  -- 7. Create notification for the admin
  insert into public.notificacoes(arena_id, message, type, link_to)
  values(v_reserva.arena_id, 'Reserva #' || substr(p_reserva_id::text, 1, 8) || ' de ' || v_reserva.clientName || ' foi cancelada pelo cliente.', 'cancelamento', '/reservas');

  return json_build_object('success', true, 'message', 'Reserva cancelada com sucesso.', 'credit_returned', v_credit_to_return);
end;
$$ language plpgsql security definer;

-- Grant execution to authenticated users
grant execute on function public.handle_client_cancellation_final(uuid) to authenticated;
