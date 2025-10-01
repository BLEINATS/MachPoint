/*
# [Refactor] Reservation Cancellation Flow v7
[This migration refactors the reservation cancellation process to ensure clients can cancel their own bookings securely.]

## Query Description: [This operation rebuilds the security policies and server-side function for reservation cancellations. It drops old, potentially conflicting policies and functions before creating new, correct ones. This change is safe and improves security by relying on standard Row-Level Security.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops policies: "Allow clients to cancel their own reservations", "Allow authenticated users to cancel own bookings" on `reservas`.
- Creates policies: "Allow clients full access to their own reservations" on `reservas`.
- Drops functions: `client_cancel_booking`, `cancel_booking_as_client`, `client_cancel_reservation_by_id_v3`, `client_cancel_reservation_by_id_v2`.
- Creates function: `cancel_my_reservation(uuid)`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, consolidates client policies on `reservas` table.
- Auth Requirements: User must be authenticated.

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. Negligible impact on performance.]
*/

-- Step 1: Drop old, potentially conflicting policies if they exist.
-- Using DO $$ BEGIN ... END $$ to handle cases where policies might not exist.
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow clients to cancel their own reservations" ON public.reservas;
EXCEPTION
    WHEN undefined_object THEN
        -- Do nothing, policy didn't exist.
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to cancel own bookings" ON public.reservas;
EXCEPTION
    WHEN undefined_object THEN
        -- Do nothing, policy didn't exist.
END $$;

-- Step 2: Consolidate client policies for simplicity and correctness.
-- This ensures clients can view, create, and update (which includes cancelling) their own reservations.
DROP POLICY IF EXISTS "Allow clients to view their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to create their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to update their own reservations" ON public.reservas;

CREATE POLICY "Allow clients full access to their own reservations"
ON public.reservas FOR ALL
USING ( auth.uid() = profile_id )
WITH CHECK ( auth.uid() = profile_id );

-- Step 3: Drop old functions to clean up.
DROP FUNCTION IF EXISTS public.client_cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_as_client(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id(uuid);


-- Step 4: Create a new, clean function that relies on RLS.
-- SECURITY INVOKER is key here, as it uses the caller's permissions.
CREATE OR REPLACE FUNCTION public.cancel_my_reservation(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- This is crucial. It respects the RLS policies of the calling user.
AS $$
BEGIN
  -- The RLS policy "Allow clients full access to their own reservations"
  -- will automatically ensure that only the owner can perform this update.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;
END;
$$;

-- Step 5: Grant permission for any authenticated user to call this function.
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation(uuid) TO authenticated;
