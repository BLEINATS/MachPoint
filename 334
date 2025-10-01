/*
          # [Function Security] Secure create_booking_with_credit
          [This operation secures the `create_booking_with_credit` function by setting a fixed search_path, which is a security best practice.]

          ## Query Description: [This operation will redefine the `create_booking_with_credit` function to enhance its security by explicitly setting the `search_path`. This change does not alter the function's logic but prevents potential security vulnerabilities. No data will be affected, and the function's behavior will remain the same.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: `public.create_booking_with_credit(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,jsonb,uuid)`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.create_booking_with_credit(p_arena_id uuid, p_quadra_id uuid, p_date date, p_start_time character varying, p_end_time character varying, p_total_price numeric, p_payment_status public.payment_status_enum, p_sport_type character varying, p_rented_items jsonb, p_aluno_id uuid)
 RETURNS TABLE(reserva_id uuid, success boolean, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_aluno public.alunos;
    v_new_reserva_id uuid;
    v_credit_to_use numeric;
BEGIN
    -- Set a secure search_path
    SET search_path = 'public';

    -- Get aluno details
    SELECT * INTO v_aluno FROM public.alunos WHERE id = p_aluno_id AND arena_id = p_arena_id;

    IF v_aluno IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, false, 'Aluno não encontrado.'::text;
        RETURN;
    END IF;

    -- Determine credit to use
    v_credit_to_use := LEAST(v_aluno.credit_balance, p_total_price);

    -- Insert new reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, date, start_time, end_time, total_price, 
        payment_status, sport_type, rented_items, profile_id, clientName, clientPhone, credit_used
    ) VALUES (
        p_arena_id, p_quadra_id, p_date, p_start_time, p_end_time, p_total_price,
        p_payment_status, p_sport_type, p_rented_items, v_aluno.profile_id, v_aluno.name, v_aluno.phone, v_credit_to_use
    ) RETURNING id INTO v_new_reserva_id;

    -- Update aluno's credit balance if credit was used
    IF v_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - v_credit_to_use
        WHERE id = p_aluno_id;

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (p_aluno_id, p_arena_id, -v_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || v_new_reserva_id, v_new_reserva_id);
    END IF;

    RETURN QUERY SELECT v_new_reserva_id, true, 'Reserva criada com sucesso.'::text;

EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT NULL::uuid, false, SQLERRM;
END;
$function$
;
