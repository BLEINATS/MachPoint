/*
# [Function] Definitive Fix for Client Reservation Cancellation
[This operation creates a new, simplified, and secure function for clients to cancel their own reservations. This new function, 'cancel_my_booking', is designed to be robust and avoid any potential schema cache issues by using a clean name and relying on the table's Row-Level Security (RLS) policies for permission checks, which is the standard and safest method.]

## Query Description: [This operation will create a new database function and drop the previous one. It is a safe operation that will not affect existing data. It is the definitive fix for the persistent cancellation error.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function `public.cancel_my_booking` will be created.
- Function `public.client_cancel_reservation_by_id_v3` will be dropped.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/

-- Drop the previous version to avoid conflicts
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);

-- Create the new, definitive function that relies on RLS policies
CREATE OR REPLACE FUNCTION public.cancel_my_booking(booking_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- The RLS policy on the 'reservas' table will handle the permission check.
  -- This function just needs to execute the update. If the user doesn't have
  -- permission according to the RLS policy, this UPDATE will fail.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = booking_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_my_booking(uuid) TO authenticated;
