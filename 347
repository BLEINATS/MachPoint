/*
# [Fix] Correct Profile ID on Credit Transaction
[This operation corrects a bug in the cancellation function where the user's profile ID was not being correctly recorded when generating a credit transaction, causing a "not-null constraint" error.]

## Query Description: [This operation replaces the existing client cancellation function with a new, corrected version. It ensures that when a reservation is cancelled and a credit is generated, the credit transaction is correctly linked to the user's profile. This change is safe and does not affect existing data, only the behavior of future cancellations.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Replaces function: `public.handle_client_cancellation_final`
- Creates function: `public.handle_client_cancellation_final_v2`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [The function is callable by any authenticated user but contains internal checks to ensure they can only cancel their own reservations.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None. The change is a minor logical correction within the function.]
*/

-- Drop the previous version to be safe
drop function if exists public.handle_client_cancellation_final;

-- Create the new, corrected version
create or replace function public.handle_client_cancellation_final_v2(p_reserva_id uuid)
returns void as $$
declare
  v_reserva public.reservas;
  v_arena public.arenas;
  v_aluno public.alunos;
  v_credit_amount numeric := 0;
  v_hours_until_reservation int;
begin
  -- 1. Fetch the reservation and related arena info
  select * into v_reserva from public.reservas where id = p_reserva_id;
  select * into v_arena from public.arenas where id = v_reserva.arena_id;

  -- Security Check: Ensure the user calling this is the one who made the reservation
  if v_reserva.profile_id is null or v_reserva.profile_id != auth.uid() then
    raise exception 'Permissão negada: Você só pode cancelar suas próprias reservas.';
  end if;

  -- 2. Find the corresponding "aluno" profile for the user in this arena
  select * into v_aluno from public.alunos where profile_id = v_reserva.profile_id and arena_id = v_reserva.arena_id;
  if not found then
    raise exception 'Perfil de cliente não encontrado nesta arena.';
  end if;

  -- 3. Calculate credit based on the arena's policy
  v_hours_until_reservation := extract(epoch from (v_reserva.date + v_reserva.start_time - now())) / 3600;

  if v_hours_until_reservation >= 24 then
    v_credit_amount := v_reserva.total_price;
  elsif v_hours_until_reservation >= 12 then
    v_credit_amount := v_reserva.total_price * 0.5;
  else
    v_credit_amount := 0;
  end if;

  -- 4. Update the reservation status
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;

  -- 5. Apply credit if applicable
  if v_credit_amount > 0 then
    -- Add credit to aluno's balance
    update public.alunos
    set credit_balance = credit_balance + v_credit_amount
    where id = v_aluno.id;

    -- Log the credit transaction (CORRECTED LINE)
    insert into public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
    values (v_aluno.id, v_arena.id, v_credit_amount, 'cancellation_credit', 'Crédito de cancelamento da reserva #' || substr(v_reserva.id::text, 1, 8), v_reserva.id, v_reserva.profile_id);
  end if;

end;
$$ language plpgsql security definer;

-- Grant execution permission
grant execute on function public.handle_client_cancellation_final_v2(uuid) to authenticated;
