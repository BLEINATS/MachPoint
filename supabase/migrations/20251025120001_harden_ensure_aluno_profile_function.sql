/*
  # [Security Hardening] Set Search Path for ensure_aluno_profile

  [This operation secures the `ensure_aluno_profile` function by explicitly setting its search path. This is a preventative measure against potential security vulnerabilities and does not change the function's behavior.]

  ## Query Description: [This operation will temporarily drop and then recreate the `ensure_aluno_profile` function to apply a security best practice. There is no impact on existing data or application functionality.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: `public.ensure_aluno_profile(uuid, uuid)`
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_aluno_id uuid;
BEGIN
  -- Check if an 'aluno' profile already exists for this user in this arena
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

  -- If it doesn't exist, create one
  IF v_aluno_id IS NULL THEN
    INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, plan_name, join_date)
    SELECT p_profile_id, p_arena_id, p.name, p.email, p.phone, 'ativo', 'Avulso', CURRENT_DATE
    FROM public.profiles p
    WHERE p.id = p_profile_id
    RETURNING id INTO v_aluno_id;
  END IF;

  RETURN v_aluno_id;
END;
$$;
