/*
# [Fix] Duplicate Policy Error on 'reservas'
[This migration corrects a "policy already exists" error by ensuring any conflicting policies on the 'reservas' table are dropped before being recreated. This makes the migration script safe to run multiple times.]

## Query Description: [This operation modifies security policies on the 'reservas' table. It drops existing client-related policies and creates a new, comprehensive one. This is a safe structural change and does not affect existing reservation data.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables affected: public.reservas
- Policies dropped: "Allow clients to view their own reservations", "Allow clients full access to their own reservations"
- Policies created: "Allow clients full access to their own reservations"

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Drop the old, more restrictive policy if it exists
DROP POLICY IF EXISTS "Allow clients to view their own reservations" ON public.reservas;

-- Drop the new policy if it already exists to prevent errors
DROP POLICY IF EXISTS "Allow clients full access to their own reservations" ON public.reservas;

-- Create a new, comprehensive policy for clients
CREATE POLICY "Allow clients full access to their own reservations"
ON public.reservas
FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);
