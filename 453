/*
          # [Function Security] Secure ensure_aluno_profile Function
          [This operation secures the ensure_aluno_profile function by setting a fixed search_path, preventing potential hijacking vulnerabilities.]

          ## Query Description: [This operation will safely drop and recreate the ensure_aluno_profile function to add a security parameter (search_path). This change is non-destructive and improves the function's security without altering its behavior. No data will be affected.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.ensure_aluno_profile
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(
    p_profile_id uuid,
    p_arena_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    -- Check if an 'aluno' record already exists for this profile_id and arena_id
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
