/*
          # [SECURITY] Set Search Path for create_my_aluno_profile
          [This operation enhances security by setting a fixed search_path for the function, preventing potential hijacking vulnerabilities.]

          ## Query Description: [This operation modifies an existing function to improve its security posture. It does not alter the function's logic or impact existing data. It is a safe and recommended update.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `public.create_my_aluno_profile()` will be updated.
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_aluno_id uuid;
  v_user_profile profiles;
BEGIN
  -- 1. Get the profile of the currently authenticated user
  SELECT * INTO v_user_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found. Cannot create aluno profile.';
  END IF;

  -- 2. Check if an aluno profile already exists for this user in this arena
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = v_user_profile.id AND arena_id = p_arena_id;

  -- 3. If it already exists, return the existing ID
  IF v_aluno_id IS NOT NULL THEN
    RETURN v_aluno_id;
  END IF;

  -- 4. If it doesn't exist, create a new aluno profile
  INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
  VALUES (
    p_arena_id,
    v_user_profile.id,
    v_user_profile.name,
    v_user_profile.email,
    v_user_profile.phone,
    'ativo',
    'Avulso',
    CURRENT_DATE
  )
  RETURNING id INTO v_aluno_id;

  -- 5. Return the new aluno_id
  RETURN v_aluno_id;
END;
$$;
