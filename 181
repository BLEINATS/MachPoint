/*
# [Operation Name]
[Secure Function ensure_aluno_profile]

## Query Description: [This operation enhances the security of the `ensure_aluno_profile` function by setting a fixed `search_path`. This prevents potential security vulnerabilities related to search path hijacking, ensuring the function's execution context is secure and predictable. This is a preventative security measure with no impact on functionality.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[Affects the function `public.ensure_aluno_profile` by adding `SET search_path`.]

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible impact on performance.]
*/
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_name text;
    v_profile_phone text;
    v_profile_email text;
BEGIN
    -- Check if an 'aluno' profile already exists for this profile_id and arena_id
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If it doesn't exist, create one
    IF v_aluno_id IS NULL THEN
        -- Get user details from the profiles table
        SELECT name, phone, email INTO v_profile_name, v_profile_phone, v_profile_email FROM public.profiles WHERE id = p_profile_id;

        INSERT INTO public.alunos (profile_id, arena_id, name, phone, email, status, plan_name, join_date)
        VALUES (p_profile_id, p_arena_id, v_profile_name, v_profile_phone, v_profile_email, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id INTO v_aluno_id;
    END IF;

    RETURN v_aluno_id;
END;
$$;
