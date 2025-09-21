/*
# [Function] Recreate Client Cancellation Function
[This migration drops any previous versions of the cancellation function and recreates it with a new name and correct permissions to resolve schema cache issues.]

## Query Description: [This operation is safe. It drops and recreates a database function. No user data is affected. It is designed to fix an application error where the function could not be found.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Drops function: public.cancel_my_reservation
- Creates function: public.client_cancel_reservation
- Grants execute on new function to 'authenticated' role

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Function can only be executed by authenticated users on their own reservations.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. Function creation is a fast, one-time operation.]
*/

-- Drop the old function if it exists, under any possible name we've used
DROP FUNCTION IF EXISTS public.cancel_my_reservation(p_reserva_id uuid);
DROP FUNCTION IF EXISTS public.cancel_my_reservation(uuid);

-- Create the new, correctly named and secured function
CREATE OR REPLACE FUNCTION public.client_cancel_reservation(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the caller is the owner of the reservation
  IF NOT EXISTS (
    SELECT 1 FROM public.reservas
    WHERE id = p_reserva_id AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permissão negada: você só pode cancelar suas próprias reservas.';
  END IF;

  -- Update the reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;
END;
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.client_cancel_reservation(uuid) TO authenticated;
