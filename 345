/*
# [Fix] RLS for Credit Transactions and Refactor Cancellation Function
[This migration adds a Row-Level Security policy to the `credit_transactions` table, allowing users to insert their own credit records. It also refactors the reservation cancellation function to use `SECURITY INVOKER` for improved security and reliability, which should resolve the persistent "function not found" error.]

## Query Description: [This is a structural and security enhancement. It ensures that users can only manage credit transactions linked to their own profiles and makes the cancellation function more robust by running it with the caller's permissions. This is a safe operation.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false (requires manual reversal of policies and function)

## Structure Details:
- Table: `credit_transactions` (new RLS policy)
- Function: `client_cancel_booking_and_apply_credit` (dropped)
- Function: `cancel_reservation_and_get_credit` (created with `SECURITY INVOKER`)

## Security Implications:
- RLS Status: [Enabled] on `credit_transactions`
- Policy Changes: [Yes], new policy added.
- Auth Requirements: [User must be authenticated]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Low]
*/

-- Step 1: Enable RLS on the credit_transactions table if not already enabled.
-- It's safe to run this even if it's already enabled.
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policy with the same name to avoid conflicts.
DROP POLICY IF EXISTS "Allow users to insert their own credit transactions" ON public.credit_transactions;

-- Step 3: Create a policy that allows a user to insert a credit transaction
-- if the 'aluno_id' of the transaction belongs to them.
CREATE POLICY "Allow users to insert their own credit transactions"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.alunos a
    WHERE a.id = credit_transactions.aluno_id AND a.profile_id = auth.uid()
  )
);

-- Step 4: Drop the old function to ensure a clean slate.
DROP FUNCTION IF EXISTS public.client_cancel_booking_and_apply_credit(uuid);

-- Step 5: Create the new function with SECURITY INVOKER.
CREATE OR REPLACE FUNCTION public.cancel_reservation_and_get_credit(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
-- Use SECURITY INVOKER: The function will run with the permissions of the user calling it.
-- This is why we needed the RLS policy on credit_transactions.
SECURITY INVOKER
AS $$
DECLARE
    v_reserva "public"."reservas";
    v_arena "public"."arenas";
    v_aluno "public"."alunos";
    v_hours_until_reservation int;
    v_credit_to_apply numeric := 0;
    v_policy_text text;
BEGIN
    -- The function now runs as the user, so RLS on 'reservas' will automatically
    -- check for ownership. We just need to select the reservation.
    SELECT * INTO v_reserva
    FROM "public"."reservas"
    WHERE id = p_reserva_id;

    -- If RLS prevents the select, v_reserva will be NULL.
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'Reservation not found or you do not have permission to cancel it.';
    END IF;

    -- Get arena details
    SELECT * INTO v_arena
    FROM "public"."arenas"
    WHERE id = v_reserva.arena_id;

    IF v_arena IS NULL THEN
        RAISE EXCEPTION 'Arena not found for this reservation.';
    END IF;

    -- Calculate hours until reservation
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

    -- Determine credit based on policy
    IF v_hours_until_reservation >= 24 THEN
        v_credit_to_apply := v_reserva.total_price;
        v_policy_text := 'Cancelamento com +24h';
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_to_apply := v_reserva.total_price * 0.5;
        v_policy_text := 'Cancelamento entre 12h e 24h';
    ELSE
        v_credit_to_apply := 0;
        v_policy_text := 'Cancelamento com -12h';
    END IF;

    -- Update the reservation status. RLS policy on 'reservas' allows this.
    UPDATE "public"."reservas"
    SET status = 'cancelada'
    WHERE id = p_reserva_id;

    -- Apply credit if applicable
    IF v_credit_to_apply > 0 THEN
        -- Find the corresponding 'aluno' profile
        SELECT * INTO v_aluno
        FROM "public"."alunos"
        WHERE profile_id = auth.uid() AND arena_id = v_reserva.arena_id;

        IF v_aluno IS NOT NULL THEN
            -- Update credit balance. RLS policy on 'alunos' allows this.
            UPDATE "public"."alunos"
            SET credit_balance = credit_balance + v_credit_to_apply
            WHERE id = v_aluno.id;

            -- Log the transaction. The new RLS policy on 'credit_transactions' allows this.
            INSERT INTO "public"."credit_transactions" (aluno_id, arena_id, amount, type, description, related_reservation_id)
            VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_apply, 'cancellation_credit', 'Crédito (' || v_policy_text || ') da reserva #' || substr(v_reserva.id::text, 1, 8), v_reserva.id);
        ELSE
            RAISE NOTICE 'Could not find an "aluno" profile for user to apply credit.';
        END IF;
    END IF;

END;
$$;

-- Step 6: Grant execute permission to the authenticated role.
GRANT EXECUTE ON FUNCTION public.cancel_reservation_and_get_credit(uuid) TO authenticated;
