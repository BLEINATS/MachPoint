/*
  # [Function] create_booking_with_credit
  Creates a new reservation and deducts credit from the client's balance in a single transaction.

  ## Query Description:
  - This function is designed to be called by authenticated clients.
  - It first validates if the client has enough credit balance for the operation.
  - If credit is used, it updates the client's balance and records the transaction.
  - It then inserts the new reservation record.
  - The entire operation is atomic. If any step fails, the whole transaction is rolled back.
  - This is a safe operation as it runs with the invoker's security context and relies on RLS policies.

  ## Metadata:
  - Schema-Category: ["Structural", "Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: false (creates new data)

  ## Structure Details:
  - Tables affected: public.reservas (INSERT), public.alunos (UPDATE), public.credit_transactions (INSERT)

  ## Security Implications:
  - RLS Status: Enabled and relied upon.
  - Policy Changes: No. This function depends on existing RLS policies.
  - Auth Requirements: Authenticated user ('authenticated' role).
  - SECURITY INVOKER: The function executes with the permissions of the user calling it.

  ## Performance Impact:
  - Indexes: Uses primary keys on affected tables.
  - Triggers: May fire triggers on the affected tables.
  - Estimated Impact: Low. The function performs a few indexed lookups and inserts/updates.
*/
CREATE OR REPLACE FUNCTION public.create_booking_with_credit(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_credit_used numeric,
    p_client_name text,
    p_client_phone text,
    p_sport_type text,
    p_rented_items jsonb,
    p_is_recurring boolean,
    p_recurring_end_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_aluno_id uuid;
    v_current_credit numeric;
    v_new_reserva_id uuid;
BEGIN
    -- 1. Find the client's 'aluno' profile for the specified arena.
    SELECT id, credit_balance INTO v_aluno_id, v_current_credit
    FROM public.alunos
    WHERE profile_id = v_user_id AND arena_id = p_arena_id;

    IF v_aluno_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de cliente não encontrado para esta arena. Por favor, siga a arena primeiro.';
    END IF;

    -- 2. Validate credit balance if credit is being used.
    IF p_credit_used > 0 THEN
        IF v_current_credit < p_credit_used THEN
            RAISE EXCEPTION 'Saldo de crédito insuficiente. Saldo atual: %, Crédito necessário: %', v_current_credit, p_credit_used;
        END IF;
    END IF;

    -- 3. Insert the new reservation.
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        date,
        start_time,
        end_time,
        total_price,
        credit_used,
        clientName,
        clientPhone,
        sport_type,
        rented_items,
        isRecurring,
        recurringEndDate,
        status,
        type,
        payment_status
    ) VALUES (
        p_arena_id,
        p_quadra_id,
        v_user_id,
        p_date,
        p_start_time,
        p_end_time,
        p_total_price,
        p_credit_used,
        p_client_name,
        p_client_phone,
        p_sport_type,
        p_rented_items,
        p_is_recurring,
        p_recurring_end_date,
        'confirmada',
        'avulsa',
        CASE WHEN (p_total_price - p_credit_used) <= 0 THEN 'pago' ELSE 'pendente' END
    ) RETURNING id INTO v_new_reserva_id;

    -- 4. If credit was used, update the balance and log the transaction.
    IF p_credit_used > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_used
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (
            aluno_id,
            arena_id,
            amount,
            type,
            description,
            related_reservation_id,
            created_by
        ) VALUES (
            v_aluno_id,
            p_arena_id,
            -p_credit_used,
            'reservation_payment',
            'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8),
            v_new_reserva_id,
            v_user_id
        );
    END IF;

    -- 5. Return the ID of the new reservation.
    RETURN v_new_reserva_id;
END;
$$;

-- Grant execution permission to authenticated users.
GRANT EXECUTE ON FUNCTION public.create_booking_with_credit(uuid, uuid, date, time, time, numeric, numeric, text, text, text, jsonb, boolean, date) TO authenticated;
