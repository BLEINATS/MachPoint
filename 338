/*
  ## MIGRATION: Definitive Fix for Client Reservation Creation
  ### Description:
  This migration provides a definitive fix for the persistent "function not found" and "permission denied" errors when a client creates a reservation. It cleans up all previous, conflicting function versions and creates a single, robust, and secure function to handle the entire process.
  ### Changes:
  1.  **Drops all old versions**: Removes `create_reservation_with_credit`, `..._v2`, and `..._v3` to prevent any further conflicts or schema cache issues.
  2.  **Ensures ENUM type exists**: Creates the `reservation_status` type if it's missing.
  3.  **Creates `create_client_reservation` function**:
      - This is a new, clean function.
      - It runs with `SECURITY INVOKER`, using the permissions of the logged-in user, which is the correct and secure approach.
      - It safely finds or creates the client's profile (`aluno`) for the arena.
      - It validates and applies credit from the user's balance.
      - It creates the reservation and credit transaction in a single operation.
  4.  **Grants Permissions**: Explicitly grants `EXECUTE` permission to all authenticated users.
*/

-- 1. Drop all old, conflicting functions to ensure a clean slate.
DROP FUNCTION IF EXISTS public.create_reservation_with_credit(uuid,uuid,uuid,text,text,date,time,time,text,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,text,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v3(uuid,uuid,uuid,text,text,date,time,time,text,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v3(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);

-- 2. Ensure the reservation_status type exists.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE public.reservation_status AS ENUM ('confirmada', 'pendente', 'cancelada');
    END IF;
END$$;

-- 3. Create the new, definitive function.
CREATE OR REPLACE FUNCTION public.create_client_reservation(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_client_name text,
    p_client_phone text,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_status public.reservation_status,
    p_type text,
    p_total_price numeric,
    p_credit_to_use numeric,
    p_payment_status text,
    p_sport_type text,
    p_notes text,
    p_is_recurring boolean,
    p_recurring_type text,
    p_recurring_end_date date,
    p_rented_items jsonb
)
RETURNS uuid -- Return the new reservation ID
LANGUAGE plpgsql
SECURITY INVOKER -- IMPORTANT: Run as the user calling it.
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_id uuid := auth.uid(); -- Get the current user's ID
    v_new_reserva_id uuid;
    v_final_payment_status text;
    v_current_credit_balance numeric;
BEGIN
    -- 1. Ensure the user has an 'aluno' profile for this arena.
    v_aluno_id := public.get_or_create_client_profile(p_arena_id, v_profile_id);

    IF v_aluno_id IS NULL THEN
        RAISE EXCEPTION 'Failed to find or create a client profile for this arena.';
    END IF;

    -- 2. Handle credit usage
    v_final_payment_status := p_payment_status;

    IF p_credit_to_use > 0 THEN
        SELECT credit_balance INTO v_current_credit_balance FROM public.alunos WHERE id = v_aluno_id;
        
        IF coalesce(v_current_credit_balance, 0) < p_credit_to_use THEN
            RAISE EXCEPTION 'Insufficient credit balance.';
        END IF;

        UPDATE public.alunos
        SET credit_balance = coalesce(credit_balance, 0) - p_credit_to_use
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, profile_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento de reserva', v_profile_id);

        IF p_credit_to_use >= p_total_price THEN
            v_final_payment_status := 'pago';
        END IF;
    END IF;

    -- 3. Insert the new reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, clientName, clientPhone, date, start_time, end_time,
        status, type, total_price, credit_used, payment_status, sport_type, notes,
        isRecurring, recurringType, recurringEndDate, rented_items, aluno_id
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time,
        p_status, p_type, p_total_price, p_credit_to_use, v_final_payment_status, p_sport_type, p_notes,
        p_is_recurring, p_recurring_type, p_recurring_end_date, p_rented_items, v_aluno_id
    )
    RETURNING id INTO v_new_reserva_id;

    RETURN v_new_reserva_id;
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_reservation(uuid,uuid,text,text,date,time,time,public.reservation_status,text,numeric,numeric,text,text,text,boolean,text,date,jsonb) TO authenticated;
