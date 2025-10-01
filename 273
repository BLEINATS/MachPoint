/*
          # [Operation Name]
          Cleanup and Recreate RLS Policies for 'reservas' Table

          ## Query Description: [This operation will reset and correctly configure the security policies for the reservations table. It first removes any existing, potentially conflicting policies for authenticated users and then re-creates them idempotently. This ensures that clients can create, view, and cancel their own reservations without permission errors, while preventing conflicts during migration.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects RLS policies on the 'public.reservas' table.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated User]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

-- Drop all potentially conflicting policies for the 'authenticated' role on 'reservas' table first.
DROP POLICY IF EXISTS "Allow clients to view their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to create their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to update their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to delete their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients full access to their own reservations" ON public.reservas;

-- Re-create the correct policies.

-- 1. SELECT: Users can read their own reservations.
CREATE POLICY "Allow clients to view their own reservations"
ON public.reservas
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- 2. INSERT: Users can create reservations for themselves.
CREATE POLICY "Allow clients to create their own reservations"
ON public.reservas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- 3. UPDATE: Users can update (e.g., cancel) their own reservations.
CREATE POLICY "Allow clients to update their own reservations"
ON public.reservas
FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 4. DELETE: Users can delete their own reservations.
CREATE POLICY "Allow clients to delete their own reservations"
ON public.reservas
FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);
