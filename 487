/*
# [Function Security Hardening]
This operation enhances the security of the `create_my_aluno_profile` function by explicitly setting the `search_path`. This prevents potential hijacking attacks by ensuring the function resolves objects (tables, types, etc.) only from trusted schemas.

## Query Description: [This operation will safely recreate the `create_my_aluno_profile` function with improved security settings. It defines a strict search path to prevent unauthorized code execution. There is no risk to existing data, and the change is fully reversible.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function being modified: `public.create_my_aluno_profile(uuid, text, text)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]
- Mitigates: Search Path Hijacking (CWE-426)

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None. This is a security and best-practice improvement with no performance overhead.]
*/
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(
    p_arena_id uuid,
    p_name text,
    p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_profile_id uuid;
    v_aluno_id uuid;
BEGIN
    -- 1. Get the profile_id of the currently authenticated user
    v_profile_id := auth.uid();

    -- 2. Check if an 'aluno' profile already exists for this user in this arena
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

    -- 3. If it doesn't exist, create it
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, plan_name, join_date)
        VALUES (p_arena_id, v_profile_id, p_name, p_phone, 'ativo', 'Avulso', NOW())
        RETURNING id INTO v_aluno_id;
    END IF;

    -- 4. Return the aluno_id (either existing or new)
    RETURN v_aluno_id;
END;
$$;
