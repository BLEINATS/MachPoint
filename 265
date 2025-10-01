/*
# [Fix Reservation RLS Policies]
This script corrects the Row-Level Security (RLS) policies for the 'reservas' table to ensure they are created correctly and avoid "policy already exists" errors.

## Query Description:
This operation will drop and recreate the security policies that allow clients to manage their own reservations. It is a safe, structural change that does not affect existing data. It ensures that the security rules are correctly applied, even if the script is run multiple times.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: public.reservas
- Policies affected:
  - "Allow clients to view their own reservations"
  - "Allow clients to create their own reservations"
  - "Allow clients to cancel their own reservations"

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (recreation of policies)
- Auth Requirements: Policies are based on `auth.uid()` to ensure users can only access their own data.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact. This is a definitional change.
*/

-- Drop existing policies if they exist to ensure idempotency
DROP POLICY IF EXISTS "Allow clients to view their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to create their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to cancel their own reservations" ON public.reservas;

-- Enable RLS on the reservas table (it's safe to run this again if it's already enabled)
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Policy for clients to view their own reservations
CREATE POLICY "Allow clients to view their own reservations"
ON public.reservas FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- Policy for clients to create their own reservations
CREATE POLICY "Allow clients to create their own reservations"
ON public.reservas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Policy for clients to cancel (update) their own reservations
CREATE POLICY "Allow clients to cancel their own reservations"
ON public.reservas FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);
