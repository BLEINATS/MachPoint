/*
# [Fix] Recreate ensure_aluno_profile function
This migration drops the existing `ensure_aluno_profile` function and recreates it with the correct return type to resolve a conflict. The new function ensures an `alunos` profile exists for a given user in a specific arena, creating one if necessary.

## Query Description:
This operation safely replaces a database function. It first drops the old version to avoid conflicts with return type changes and then creates the corrected version. There is no risk to existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Function `public.ensure_aluno_profile(uuid, uuid)` will be replaced.

## Security Implications:
- RLS Status: Not applicable to function definition.
- Policy Changes: No.
- Auth Requirements: The function uses `auth.uid()` and should be run with user's permissions.

## Performance Impact:
- Indexes: No change.
- Triggers: No change.
- Estimated Impact: Negligible.
*/

-- Drop the old function to allow changing the return type
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

-- Recreate the function with the correct logic and return type
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS public.alunos AS $$
DECLARE
  aluno_record public.alunos;
  user_profile public.profiles;
BEGIN
  -- Check if an aluno profile already exists
  SELECT * INTO aluno_record
  FROM public.alunos
  WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

  -- If it exists, return it
  IF found THEN
    RETURN aluno_record;
  END IF;

  -- If not, get user info from profiles table
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE id = p_profile_id;

  -- If profile doesn't exist, we can't proceed
  IF NOT found THEN
    RAISE EXCEPTION 'Profile not found for id %', p_profile_id;
  END IF;
  
  -- Create a new aluno profile
  INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, join_date, plan_name)
  VALUES (
    p_arena_id,
    p_profile_id,
    user_profile.name,
    user_profile.email,
    user_profile.phone,
    'ativo',
    CURRENT_DATE,
    'Avulso'
  )
  RETURNING * INTO aluno_record;

  RETURN aluno_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_aluno_profile(uuid, uuid) TO authenticated;
