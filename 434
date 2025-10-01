/*
# [Security] Harden Client Cancellation Function
[This operation enhances the security of the `handle_client_cancellation_final` function by explicitly setting its `search_path`. This is a preventative security measure and does not alter the function's cancellation logic.]

## Query Description: [This operation will update an existing database function to improve its security. It is a safe, non-destructive change that has no impact on data or application functionality. No backup is required.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function to be updated: `public.handle_client_cancellation_final(uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserva RECORD;
    v_aluno RECORD;
    v_credit_amount numeric := 0;
    v_hours_until_reservation integer;
BEGIN
    -- Get reservation details, ensuring it belongs to the calling user
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id AND profile_id = auth.uid();

    -- Check if reservation exists and is confirmed
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'Reserva não encontrada, não pertence a você ou não está em um estado cancelável.';
    END IF;

    IF v_reserva.status <> 'confirmada' THEN
        RAISE EXCEPTION 'Apenas reservas confirmadas podem ser canceladas.';
    END IF;

    -- Get client profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = auth.uid() AND arena_id = v_reserva.arena_id;
    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Perfil de cliente não encontrado para esta arena.';
    END IF;

    -- Calculate hours until reservation
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

    -- Calculate credit based on a simple policy (24h = 100%, 12h = 50%)
    IF v_hours_until_reservation >= 24 THEN
        v_credit_amount := v_reserva.total_price;
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_amount := v_reserva.total_price * 0.5;
    ELSE
        v_credit_amount := 0;
    END IF;

    -- Update reservation status
    UPDATE public.reservas
    SET status = 'cancelada'
    WHERE id = p_reserva_id;

    -- Add credit if applicable
    IF v_credit_amount > 0 THEN
        -- Use the add_credit_to_aluno function to handle the credit update
        PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_amount);

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id);
    END IF;
END;
$$;
