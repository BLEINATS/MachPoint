/*
# Operation: Harden Functions
[This script enhances the security of database functions by setting a fixed search_path, mitigating potential security risks as advised by Supabase.]

## Query Description: [This operation modifies the 'create_my_aluno_profile' and 'ensure_aluno_profile' functions to improve security. It does not alter functionality or data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions affected:
  - public.create_my_aluno_profile(uuid, text, text)
  - public.ensure_aluno_profile(uuid, uuid)

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Harden create_my_aluno_profile function
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(
    p_arena_id uuid,
    p_name text,
    p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    -- Insert a new record into the 'alunos' table
    INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, plan_name, join_date)
    VALUES (p_arena_id, auth.uid(), p_name, p_phone, 'ativo', 'Avulso', NOW())
    RETURNING id INTO v_aluno_id;

    -- Return the ID of the newly created 'aluno'
    RETURN v_aluno_id;
END;
$$;

-- Harden ensure_aluno_profile function
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(
    p_arena_id uuid,
    p_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE arena_id = p_arena_id AND profile_id = p_profile_id) THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
        SELECT p_arena_id, id, name, email, phone, 'ativo', 'Avulso', NOW()
        FROM public.profiles
        WHERE id = p_profile_id;
    END IF;
END;
$$;
