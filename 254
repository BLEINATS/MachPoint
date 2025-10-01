/*
  # [Function] Create Secure Client Cancellation Function
  [This function allows an authenticated user to cancel their own reservation by checking ownership before updating the status.]

  ## Query Description: [This operation creates a new function `client_cancel_own_reservation` and grants execute permission to authenticated users. It is a safe, non-destructive operation that adds functionality.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Creates function: `public.client_cancel_own_reservation(uuid)`
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [Function checks `auth.uid()` internally to ensure user can only cancel their own reservations.]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [Negligible. Adds a new function.]
*/
CREATE OR REPLACE FUNCTION public.client_cancel_own_reservation(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva_owner_id uuid;
BEGIN
  -- Get the owner of the reservation
  SELECT profile_id INTO v_reserva_owner_id
  FROM public.reservas
  WHERE id = p_reserva_id;

  -- Check if the current user is the owner of the reservation
  IF v_reserva_owner_id = auth.uid() THEN
    -- If they are the owner, update the status to 'cancelada'
    UPDATE public.reservas
    SET status = 'cancelada'
    WHERE id = p_reserva_id;
  ELSE
    -- If not the owner, raise an exception
    RAISE EXCEPTION 'Permissão negada: Você só pode cancelar suas próprias reservas.';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.client_cancel_own_reservation(uuid) TO authenticated;
