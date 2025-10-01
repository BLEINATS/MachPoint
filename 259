/*
  # [Critical] Fix Reservation Cancellation Permissions
  [This migration creates a secure function to allow clients to cancel their own reservations, bypassing potential RLS complexities that are causing persistent errors.]

  ## Query Description: [This operation creates a database function (`cancel_my_reservation_securely`) that handles the logic for reservation cancellation. It is designed to run with elevated privileges (`SECURITY DEFINER`) to perform the update, but internally checks that the user is the owner of the reservation, ensuring security. This should definitively resolve the "permission denied" errors.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Creates a new function: `public.cancel_my_reservation_securely`
  - Drops the old function if it exists: `public.cancel_my_reservation`
  
  ## Security Implications:
  - RLS Status: [Unaffected]
  - Policy Changes: [No]
  - Auth Requirements: [The function internally checks `auth.uid()`]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible]
*/

-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.cancel_my_reservation(p_reserva_id uuid);
DROP FUNCTION IF EXISTS public.cancel_my_reservation_securely(p_reserva_id uuid);

-- Create a new, secure function for cancellation
CREATE OR REPLACE FUNCTION public.cancel_my_reservation_securely(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function runs with the definer's rights, but we explicitly
  -- check that the calling user is the owner of the reservation.
  -- This is a secure way to bypass complex RLS issues for a specific action.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id AND profile_id = auth.uid();
END;
$$;

-- Grant permission for any authenticated user to call this function
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation_securely(uuid) TO authenticated;
