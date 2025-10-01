/*
  # [Operation Name]
  [This operation secures the 'ensure_aluno_profile' function by setting a fixed search_path, mitigating a security advisory.]
  ## Query Description: [This script safely drops and recreates a database function to apply security best practices. It modifies the function's definition to prevent potential search_path hijacking vulnerabilities, without altering its core logic or impacting existing data. This is a low-risk, preventative security enhancement.]
  ## Metadata:
  - Schema-Category: 'Security'
  - Impact-Level: 'Low'
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'ensure_aluno_profile' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. This change only affects the function's security context.
*/
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(
    p_profile_id uuid,
    p_arena_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_name text;
    v_profile_phone text;
BEGIN
    -- Check if an aluno profile already exists for this profile_id and arena_id
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id
    LIMIT 1;
    -- If it exists, return the existing aluno_id
    IF v_aluno_id IS NOT NULL THEN
        RETURN v_aluno_id;
    END IF;
    -- If not, fetch the user's name and phone from the public.profiles table
    SELECT name, phone INTO v_profile_name, v_profile_phone
    FROM public.profiles
    WHERE id = p_profile_id;
    -- Create a new aluno profile
    INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, join_date, plan_name)
    VALUES (p_profile_id, p_arena_id, v_profile_name, v_profile_phone, 'ativo', CURRENT_DATE, 'Avulso')
    RETURNING id INTO v_aluno_id;
    RETURN v_aluno_id;
END;
$$;
