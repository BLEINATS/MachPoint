/*
# [Fix] Recreate is_arena_admin function
This operation drops and recreates the 'is_arena_admin' function to resolve a signature change error.

## Query Description: [This operation fixes a function definition error by first removing the old version and then creating the correct one. It is a safe, non-destructive operation that ensures the function for checking arena administration rights works as intended.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops the function `public.is_arena_admin(uuid)`.
- Recreates the function `public.is_arena_admin(uuid)` with a corrected parameter name and security settings.

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [None for migration, function requires auth context to run]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Drop the existing function to allow for signature changes
DROP FUNCTION IF EXISTS public.is_arena_admin(uuid);

-- Recreate the function with the correct parameter name and security settings
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the currently authenticated user is the owner of the specified arena
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
END;
$$;
