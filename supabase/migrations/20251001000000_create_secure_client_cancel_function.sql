/*
          # [Function] Create Secure Client Cancellation Function
          [This function allows a client to securely cancel their own reservation. It calculates the credit based on the arena's policy, updates the reservation status, and applies the credit to the client's account.]

          ## Query Description: [This operation creates a new database function `client_cancel_my_reservation`. It is designed to be called by authenticated users and contains security checks to ensure a user can only cancel their own bookings. It is a safe, non-destructive operation that adds functionality.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates a new function: `public.client_cancel_my_reservation(uuid)`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated User]
          - This function uses `SECURITY INVOKER` to run with the permissions of the calling user, ensuring they can only affect their own data as per RLS policies.
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low. This is a standard function creation.]
          */
CREATE OR REPLACE FUNCTION public.client_cancel_my_reservation(reservation_id_to_cancel uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  target_reservation public.reservas;
  target_aluno public.alunos;
  hours_until_reservation INT;
  credit_to_add NUMERIC := 0;
  credit_reason TEXT;
BEGIN
  -- 1. Fetch the reservation and ensure the user owns it
  SELECT *
  INTO target_reservation
  FROM public.reservas
  WHERE id = reservation_id_to_cancel AND profile_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada ou reserva não encontrada.';
  END IF;

  -- 2. Check if already cancelled
  IF target_reservation.status = 'cancelada' THEN
    RETURN; -- Or RAISE EXCEPTION 'Reserva já está cancelada.';
  END IF;

  -- 3. Calculate credit based on time difference
  hours_until_reservation := EXTRACT(EPOCH FROM (target_reservation.date + target_reservation.start_time - now())) / 3600;

  IF hours_until_reservation >= 24 THEN
    credit_to_add := target_reservation.total_price;
    credit_reason := 'Cancelamento com +24h';
  ELSIF hours_until_reservation >= 12 THEN
    credit_to_add := target_reservation.total_price * 0.5;
    credit_reason := 'Cancelamento entre 12h-24h';
  ELSE
    credit_to_add := 0;
    credit_reason := 'Cancelamento com -12h';
  END IF;

  -- 4. Update the reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = reservation_id_to_cancel;

  -- 5. If credit is due, find the aluno profile and apply it
  IF credit_to_add > 0 THEN
    SELECT *
    INTO target_aluno
    FROM public.alunos
    WHERE profile_id = target_reservation.profile_id AND arena_id = target_reservation.arena_id;

    IF FOUND THEN
      -- Update aluno's credit balance
      UPDATE public.alunos
      SET credit_balance = credit_balance + credit_to_add
      WHERE id = target_aluno.id;

      -- Log the credit transaction
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (target_aluno.id, target_reservation.arena_id, credit_to_add, 'cancellation_credit', credit_reason, reservation_id_to_cancel);
    END IF;
  END IF;

END;
$$;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.client_cancel_my_reservation(uuid) TO authenticated;
