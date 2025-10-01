-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow clients full access to their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to view their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Allow clients to cancel their own reservations" ON public.reservas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reservas;

-- Allow authenticated users to view all reservations in their arena
CREATE POLICY "Enable read access for all users"
ON public.reservas FOR SELECT
TO authenticated
USING (true);

-- Allow clients to create their own reservations
CREATE POLICY "Allow clients to create their own reservations"
ON public.reservas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Allow clients to update (cancel) their own reservations
CREATE POLICY "Allow clients to cancel their own reservations"
ON public.reservas FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);
