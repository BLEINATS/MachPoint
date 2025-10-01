/*
# [Fix] Recreate ensure_aluno_profile function
This migration corrects an issue where the return type of the `ensure_aluno_profile` function cannot be changed directly. It safely drops the old function and recreates it with the correct structure.

## Query Description: [This operation will drop and recreate the `ensure_aluno_profile` function. This is a safe, structural change and does not affect existing data. It is necessary to allow for updates to the function's return type.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops function: `public.ensure_aluno_profile(uuid, uuid)`
- Creates function: `public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Drop the existing function to allow changing its return type
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

-- Recreate the function with the correct definition
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id uuid;
  v_profile_name text;
  v_profile_email text;
  v_profile_phone text;
BEGIN
  -- Check if an aluno profile already exists for this profile_id and arena_id
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

  -- If it doesn't exist, create it
  IF v_aluno_id IS NULL THEN
    -- Get profile details
    SELECT name, email, phone INTO v_profile_name, v_profile_email, v_profile_phone
    FROM public.profiles
    WHERE id = p_profile_id;

    INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
    VALUES (p_arena_id, p_profile_id, v_profile_name, v_profile_email, v_profile_phone, 'ativo', 'Avulso', NOW())
    RETURNING id INTO v_aluno_id;
  END IF;

  RETURN v_aluno_id;
END;
$$;
