/*
  ## MIGRATION: Fix Reservation Creation Function (Robust)
  ### Description:
  This migration fixes a persistent error ("type does not exist") by changing the function signature to not depend directly on the custom ENUM type.
  ### Changes:
  1.  **Ensures `reservation_status` ENUM type exists**: This is still needed for the table column.
  2.  **Drops old versions of the function**: Removes any previous, faulty versions to prevent conflicts.
  3.  **Recreates the function `create_reservation_with_credit_v2`**: The `p_status` parameter is now `text` instead of `public.reservation_status` to avoid parsing errors. The function body remains the same, relying on implicit casting when inserting into the table.
  4.  **Grants permissions**: Ensures that authenticated users can execute this function.
  This approach is more robust and should resolve the migration error.
*/

-- Step 1: Ensure the ENUM type exists for the table column.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE public.reservation_status AS ENUM ('confirmada', 'pendente', 'cancelada');
    END IF;
END$$;

-- Step 2: Drop any previous versions of the function to avoid conflicts.
-- Try dropping with all possible old signatures.
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,text,text,numeric,numeric,text,text,text,boolean,text,date,jsonb);

-- Step 3: Create the new, correct version of the function with a `text` parameter for status.
CREATE OR REPLACE FUNCTION public.create_reservation_with_credit_v2(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_profile_id uuid,
    p_client_name text,
    p_client_phone text,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_status text, -- Changed to TEXT
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
    v_new_reserva_id uuid;
    v_final_total_price numeric;
    v_final_payment_status text;
BEGIN
    -- 1. Find or create the 'aluno' profile
    IF p_profile_id IS NOT NULL THEN
        SELECT id INTO v_aluno_id FROM public.alunos
        WHERE arena_id = p_arena_id AND profile_id = p_profile_id;
        IF v_aluno_id IS NULL THEN
            INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, join_date, plan_name)
            VALUES (p_arena_id, p_profile_id, p_client_name, p_client_phone, 'ativo', CURRENT_DATE, 'Avulso')
            RETURNING id INTO v_aluno_id;
        END IF;
    END IF;

    -- 2. Handle credit usage
    v_final_total_price := p_total_price;
    v_final_payment_status := p_payment_status;

    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        -- Deduct credit from aluno's balance
        UPDATE public.alunos
        SET credit_balance = coalesce(credit_balance, 0) - p_credit_to_use
        WHERE id = v_aluno_id;

        -- Record the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva');
        
        -- Adjust final price and payment status
        v_final_total_price := p_total_price - p_credit_to_use;
        IF v_final_total_price <= 0 THEN
            v_final_payment_status := 'pago';
        END IF;
    END IF;

    -- 3. Insert the new reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, clientName, clientPhone, date, start_time, end_time, 
        status, type, total_price, credit_used, payment_status, sport_type, notes, 
        isRecurring, recurringType, recurringEndDate, rented_items, aluno_id
    ) VALUES (
        p_arena_id, p_quadra_id, p_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time,
        p_status::public.reservation_status, p_type, v_final_total_price, p_credit_to_use, v_final_payment_status, p_sport_type, p_notes,
        p_is_recurring, p_recurring_type, p_recurring_end_date, p_rented_items, v_aluno_id
    ) RETURNING id INTO v_new_reserva_id;

    -- Update credit transaction with reservation ID
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.credit_transactions
        SET related_reservation_id = v_new_reserva_id
        WHERE aluno_id = v_aluno_id AND type = 'reservation_payment' AND related_reservation_id IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN v_new_reserva_id;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,text,text,numeric,numeric,text,text,text,boolean,text,date,jsonb) TO authenticated;
