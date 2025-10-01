-- Dropping old versions to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_reservation_with_credit(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,public.reservation_type,numeric,numeric,public.payment_status,text,text,boolean,public.recurring_type,date,jsonb);
DROP FUNCTION IF EXISTS public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,public.reservation_type,numeric,numeric,public.payment_status,text,text,boolean,public.recurring_type,date,jsonb);

/*
# [Function] Create Reservation with Credit (v2)
This function creates a new reservation and handles credit deduction in a single, secure transaction.

## Query Description: [This operation creates a new database function to handle reservation creation. It is a structural and safe change that improves the system's reliability. No data is at risk.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Creates function: public.create_reservation_with_credit_v2

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [Low]
*/
CREATE OR REPLACE FUNCTION public.create_reservation_with_credit_v2(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_profile_id uuid,
    p_client_name text,
    p_client_phone text,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_status public.reservation_status,
    p_type public.reservation_type,
    p_total_price numeric,
    p_credit_to_use numeric,
    p_payment_status public.payment_status,
    p_sport_type text,
    p_notes text,
    p_is_recurring boolean,
    p_recurring_type public.recurring_type,
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
    v_reserva_id uuid;
BEGIN
    -- Step 1: Ensure the 'aluno' profile exists for this arena and get its ID.
    v_aluno_id := public.get_or_create_client_profile(p_arena_id, p_profile_id);

    -- Step 2: If credit is being used, deduct it from the aluno's balance.
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    END IF;

    -- Step 3: Insert the reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, clientName, clientPhone, date, start_time, end_time, status, type,
        total_price, credit_used, payment_status, sport_type, notes, isRecurring, recurringType, recurringEndDate, rented_items
    )
    VALUES (
        p_arena_id, p_quadra_id, p_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time, p_status, p_type,
        p_total_price, p_credit_to_use, p_payment_status, p_sport_type, p_notes, p_is_recurring, p_recurring_type, p_recurring_end_date, p_rented_items
    )
    RETURNING id INTO v_reserva_id;

    -- Step 4: Log the credit transaction with the reservation ID
    IF p_credit_to_use > 0 THEN
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;

    RETURN v_reserva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_credit_v2(uuid,uuid,uuid,text,text,date,time,time,public.reservation_status,public.reservation_type,numeric,numeric,public.payment_status,text,text,boolean,public.recurring_type,date,jsonb) TO authenticated;
