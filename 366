/*
# [Fix Function] Fix `create_my_aluno_profile` function return type
[This migration fixes an error where the function's return type could not be changed. It safely drops the old function and recreates it with the correct definition, ensuring that users can create their own student profiles within an arena.]

## Query Description: [This operation will drop and recreate the `create_my_aluno_profile` function. This is a safe, non-destructive change that only affects the function's definition and is necessary to align its return type with recent updates. It should not impact any existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function `public.create_my_aluno_profile(uuid)` will be dropped and recreated.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [The function requires an authenticated user.]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

-- Drop the existing function if it exists to allow for return type changes
DROP FUNCTION IF EXISTS public.create_my_aluno_profile(uuid);

-- Recreate the function with the correct definition to return the aluno UUID
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
  v_user_name text;
  v_user_phone text;
BEGIN
  -- Get user's name and phone from their public profile
  SELECT name, phone INTO v_user_name, v_user_phone FROM public.profiles WHERE id = v_profile_id;

  -- Check if an aluno profile already exists for this user in this arena
  SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

  -- If it doesn't exist, create it
  IF v_aluno_id IS NULL THEN
    INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
    VALUES (
      p_arena_id,
      v_profile_id,
      v_user_name,
      (SELECT email FROM auth.users WHERE id = v_profile_id),
      v_user_phone,
      'ativo',
      'Avulso',
      CURRENT_DATE
    )
    RETURNING id INTO v_aluno_id;
  END IF;

  -- Return the ID of the existing or newly created aluno profile
  RETURN v_aluno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_my_aluno_profile(uuid) TO authenticated;
