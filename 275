/*
# [Function] `client_cancel_booking`
[This function allows an authenticated user to cancel their own reservation, replacing all previous versions.]

## Query Description: [This operation creates a new, secure SQL function `client_cancel_booking` to replace all previous cancellation functions. It is designed to be robust against schema cache issues. The function uses `SECURITY INVOKER` to run with the caller's permissions, ensuring a user can only cancel their own bookings. It also sets a secure search path. This is a safe structural change.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function: `public.client_cancel_booking(p_reserva_id uuid)`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Low]
*/

-- Drop all previous versions of cancellation functions to ensure a clean state.
DROP FUNCTION IF EXISTS public.cancel_my_reservation(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_as_client(uuid);
DROP FUNCTION IF EXISTS public.cancel_my_booking(uuid);

-- Create the new, definitive function with security best practices.
CREATE OR REPLACE FUNCTION public.client_cancel_booking(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '' -- Mitigates CVE-2018-1058
AS $$
BEGIN
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id
    AND profile_id = auth.uid(); -- Security check: user can only cancel their own reservation.

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada ou reserva não encontrada.';
  END IF;
END;
$$;

-- Ensure the authenticated role can use the public schema and execute the function.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_cancel_booking(uuid) TO authenticated;
