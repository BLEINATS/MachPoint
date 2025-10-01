/*
          # [Function Security] Secure ensure_aluno_profile Function
          [This operation secures the `ensure_aluno_profile` function by setting a fixed search_path, preventing potential hijacking vulnerabilities.]

          ## Query Description: [This operation will safely drop and recreate the `ensure_aluno_profile` function. It enhances security by explicitly setting the function's `search_path`, which is a best practice recommended by Supabase. There is no impact on existing data, and the function's logic remains the same.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function `ensure_aluno_profile` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          - Mitigates: `Function Search Path Mutable` warning.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: "Negligible performance impact. This is a security and stability improvement."
          */

DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(
    p_profile_id uuid,
    p_arena_id uuid,
    p_name text,
    p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    -- Check if an aluno profile already exists for this profile_id and arena_id
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If it doesn't exist, create one
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, join_date, plan_name)
        VALUES (p_profile_id, p_arena_id, p_name, p_phone, 'ativo', CURRENT_DATE, 'Avulso')
        RETURNING id INTO v_aluno_id;
    END IF;

    RETURN v_aluno_id;
END;
$$;
