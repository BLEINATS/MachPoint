/*
# [STRUCTURAL] Fix Function Return Type for create_my_aluno_profile
[This operation corrects the return type of the `create_my_aluno_profile` function to ensure it matches its intended usage and prevent type mismatch errors during execution.]

## Query Description: [This script will drop the old version of the `create_my_aluno_profile` function and recreate it with the correct return type (`SETOF public.alunos`). This is a safe operation that only affects the function's definition and does not impact existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops and recreates the `public.create_my_aluno_profile` function.

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. The operation is very fast and only affects new profile creation for clients.]
*/

-- Drop the existing function to allow for return type change
DROP FUNCTION IF EXISTS public.create_my_aluno_profile(uuid);

-- Recreate the function with the correct return type and security settings
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS SETOF public.alunos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if a profile already exists for this user in this arena
    IF EXISTS (
        SELECT 1
        FROM public.alunos
        WHERE profile_id = auth.uid() AND arena_id = p_arena_id
    ) THEN
        -- If it exists, just return the existing profile
        RETURN QUERY
        SELECT *
        FROM public.alunos
        WHERE profile_id = auth.uid() AND arena_id = p_arena_id;
        RETURN;
    END IF;

    -- If it doesn't exist, create a new one
    INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, join_date, plan_name)
    SELECT
        p.id,
        p_arena_id,
        p.name,
        p.email,
        p.phone,
        'ativo'::public.aluno_status,
        CURRENT_DATE,
        'Avulso'
    FROM public.profiles p
    WHERE p.id = auth.uid();

    -- Return the newly created profile
    RETURN QUERY
    SELECT *
    FROM public.alunos
    WHERE profile_id = auth.uid() AND arena_id = p_arena_id;
END;
$$;
