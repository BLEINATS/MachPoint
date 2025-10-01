/*
# [Fix] Recreate Missing Function: create_my_aluno_profile
[This script recreates the `create_my_aluno_profile` function, which appears to be missing from the database, causing other migration scripts to fail. This function allows a logged-in user to create their own client/student profile within a specific arena.]

## Query Description: [This operation safely creates or replaces a database function. It has no impact on existing data and is designed to fix a migration error. It is a safe, structural change.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function `public.create_my_aluno_profile(uuid)` will be created or replaced.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [The function uses the caller's authentication context (`auth.uid()`) to create a profile for themselves.]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure an 'aluno' profile exists for the current user in the specified arena.
  -- This is typically called when a user follows a new arena.
  INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
  SELECT
    p_arena_id,
    p.id,
    p.name,
    p.email,
    p.phone,
    'ativo'::public.aluno_status_enum,
    'Avulso',
    CURRENT_DATE
  FROM public.profiles p
  WHERE p.id = auth.uid()
  -- Use ON CONFLICT to do nothing if a profile already exists for this user/arena pair.
  -- This makes the function safe to call multiple times.
  ON CONFLICT (arena_id, profile_id) DO NOTHING;
END;
$$;
