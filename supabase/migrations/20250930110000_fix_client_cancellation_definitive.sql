/*
          # [Function] Fix Client Reservation Cancellation
          [This migration drops all previous cancellation functions and creates a new, secure, and atomic function to handle client-side reservation cancellations, including credit application.]

          ## Query Description: [This operation replaces several database functions with a single, more robust version. It is designed to be safe and will not affect existing data. It corrects a persistent permission and logic error that prevented clients from successfully canceling reservations and receiving credit.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops functions: `cancel_my_booking`, `client_cancel_booking`, `client_cancel_reservation`, `client_cancel_reservation_by_id`, `client_cancel_reservation_by_id_v2`, `client_cancel_reservation_by_id_v3`, `cancel_reservation_and_get_credit`, `cancel_reservation_and_get_credit_v2`, `cancel_reservation_and_get_credit_v3`.
          - Creates function: `public.cancel_reservation_and_apply_credit(uuid)`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [The new function is SECURITY DEFINER but securely checks the caller's JWT for authorization, which is a Supabase best practice.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

-- Drop all previous, potentially conflicting functions
DROP FUNCTION IF EXISTS public.cancel_my_booking(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit_v2(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit_v3(uuid);

-- Create the new, definitive function
CREATE OR REPLACE FUNCTION public.cancel_reservation_and_apply_credit(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserva RECORD;
    v_credit_amount NUMERIC;
    v_hours_until NUMERIC;
    v_aluno_id UUID;
    v_arena_id UUID;
    v_caller_uid UUID;
BEGIN
    -- Get the UID of the user calling the function from the JWT
    v_caller_uid := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid;

    -- 1. Get reservation details
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

    -- Check if reservation exists
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'Reserva não encontrada.';
    END IF;

    -- Security Check: Ensure the caller owns the reservation
    IF v_reserva.profile_id IS NULL OR v_reserva.profile_id != v_caller_uid THEN
        RAISE EXCEPTION 'Permissão negada. Você só pode cancelar suas próprias reservas.';
    END IF;

    -- 2. Find the associated aluno profile
    SELECT id, arena_id INTO v_aluno_id, v_arena_id
    FROM public.alunos
    WHERE profile_id = v_caller_uid AND arena_id = v_reserva.arena_id
    LIMIT 1;

    -- If no aluno profile, we can't add credit. Just cancel the reservation.
    IF v_aluno_id IS NULL THEN
        UPDATE public.reservas SET status = 'cancelada' WHERE id = p_reserva_id;
        RETURN;
    END IF;

    -- 3. Calculate hours until reservation
    v_hours_until := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

    -- 4. Calculate credit amount based on policy (24h=100%, 12-24h=50%, <12h=0%)
    IF v_hours_until >= 24 THEN
        v_credit_amount := v_reserva.total_price;
    ELSIF v_hours_until >= 12 THEN
        v_credit_amount := v_reserva.total_price * 0.5;
    ELSE
        v_credit_amount := 0;
    END IF;
    
    -- 5. Update reservation status
    UPDATE public.reservas SET status = 'cancelada' WHERE id = p_reserva_id;

    -- 6. If credit is due, update aluno balance and log transaction
    IF v_credit_amount > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance + v_credit_amount
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
        VALUES (v_aluno_id, v_arena_id, v_credit_amount, 'cancellation_credit', 'Crédito de cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id, v_caller_uid);
    END IF;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_reservation_and_apply_credit(uuid) TO authenticated;
