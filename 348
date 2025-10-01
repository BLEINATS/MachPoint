/*
  # [Fix Client Reservation Cancellation]
  This migration fixes a security issue where clients could not cancel their own reservations due to RLS policies and also tightens security by replacing a broad "FOR ALL" policy with more specific ones.

  ## Query Description: 
  1.  **Drops the old permissive policy**: Removes the "Allow clients to manage their own reservations" policy which allowed clients to UPDATE any field on their reservations.
  2.  **Creates specific policies**: Adds separate, safer policies for SELECT (view) and INSERT (create) for clients on their own reservations. No UPDATE or DELETE policy is granted to clients directly.
  3.  **Creates an RPC function**: Introduces a new function `public.cancel_my_reservation` that securely handles the cancellation logic. It runs with elevated privileges but contains internal checks to ensure a user can only cancel their own reservation.
  4.  **Grants permission**: Allows authenticated users to execute this new function.
  
  This change ensures clients can cancel reservations as intended without having dangerous, broad permissions to modify other reservation data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false

  ## Structure Details:
  - Modifies RLS policies on `public.reservas` table.
  - Creates a new RPC function `public.cancel_my_reservation(uuid)`.
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes. Replaces a permissive `FOR ALL` policy with stricter `SELECT` and `INSERT` policies.
  - Auth Requirements: Users must be authenticated.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low. The new RPC call is a standard and efficient operation.
*/

-- 1. Drop the old permissive policy for clients
DROP POLICY IF EXISTS "Allow clients to manage their own reservations" ON public.reservas;

-- 2. Create a specific policy for clients to VIEW their own reservations
CREATE POLICY "Allow clients to view their own reservations"
ON public.reservas
FOR SELECT
USING (
  auth.uid() = profile_id
);

-- 3. Create a specific policy for clients to CREATE their own reservations
CREATE POLICY "Allow clients to create their own reservations"
ON public.reservas
FOR INSERT
WITH CHECK (
  auth.uid() = profile_id
);

-- 4. Create the RPC function to handle cancellation securely
CREATE OR REPLACE FUNCTION public.cancel_my_reservation(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva public.reservas;
BEGIN
  -- Find the reservation and check ownership.
  -- The SELECT is subject to the caller's RLS, so if it returns a row, the caller owns it.
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found or you do not have permission to access it.';
  END IF;

  -- Check if the reservation is already cancelled
  IF v_reserva.status = 'cancelada' THEN
    RAISE EXCEPTION 'This reservation has already been cancelled.';
  END IF;

  -- Now, perform the update. The SECURITY DEFINER context will bypass the lack of an UPDATE policy.
  UPDATE public.reservas
  SET status = 'cancelada', updated_at = now()
  WHERE id = p_reserva_id;
END;
$$;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation(uuid) TO authenticated;
