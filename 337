/*
          # [SECURITY] Add Row-Level Security Policies to 'reservas' table
          This migration enables Row-Level Security (RLS) on the 'reservas' table and adds policies to allow users to manage their own reservations and admins to manage all reservations in their arena.

          ## Query Description:
          - Enables RLS on the 'reservas' table.
          - Creates policies for SELECT, INSERT, UPDATE, and DELETE, allowing authenticated users to perform these actions only on rows where their user ID matches the 'profile_id'.
          - Creates a policy to give full access to arena administrators for reservations within their own arena.
          - This operation is safe and does not affect existing data, but it enforces new access rules.

          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Table Affected: public.reservas

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, new policies are added for 'reservas'.
          - Auth Requirements: Policies are based on `auth.uid()` and the user's role in the `profiles` table.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. RLS checks are highly optimized in PostgreSQL.
          */

-- Enable RLS on the 'reservas' table
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to select their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow authenticated users to update their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow admin users full access to arena reservations" ON public.reservas;


-- Policy for SELECT: Users can see their own reservations.
CREATE POLICY "Allow authenticated users to select their own reservations"
ON public.reservas FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- Policy for INSERT: Users can create reservations for themselves.
CREATE POLICY "Allow authenticated users to insert their own reservations"
ON public.reservas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Policy for UPDATE: Users can update their own reservations.
CREATE POLICY "Allow authenticated users to update their own reservations"
ON public.reservas FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Policy for DELETE: Users can delete their own reservations.
CREATE POLICY "Allow authenticated users to delete their own reservations"
ON public.reservas FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- Policy for Arena Admins: Allow full access to reservations within their arena.
CREATE POLICY "Allow admin users full access to arena reservations"
ON public.reservas FOR ALL
TO authenticated
USING (
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) = 'admin_arena'::text
  AND
  arena_id = (
    SELECT id
    FROM public.arenas
    WHERE owner_id = auth.uid()
    LIMIT 1
  )
)
WITH CHECK (
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) = 'admin_arena'::text
  AND
  arena_id = (
    SELECT id
    FROM public.arenas
    WHERE owner_id = auth.uid()
    LIMIT 1
  )
);
