/*
# [Function] `get_or_create_client_profile`
Creates or retrieves a user's 'aluno' profile for a specific arena. This replaces the previous function to ensure correct invocation.

## Query Description:
This operation drops the old `ensure_my_aluno_profile` function and creates a new, robust version named `get_or_create_client_profile`. This function is designed to be called by authenticated users to get or create their client profile (`aluno` record) within a specific arena. This centralized database function enhances security and consistency. It uses `SECURITY DEFINER` to safely perform insertions while respecting user boundaries. This script also grants the necessary execution permissions to authenticated users.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (the function can be dropped)

## Structure Details:
- Function: `public.get_or_create_client_profile(p_arena_id uuid, p_profile_id uuid)`
- Returns: `alunos` (a single row)

## Security Implications:
- RLS Status: N/A
- Policy Changes: No.
- Auth Requirements: Grants `EXECUTE` to the `authenticated` role.
- `SECURITY DEFINER`: Runs with owner privileges for safe data insertion.
- `search_path`: Set to prevent search path hijacking.

## Performance Impact:
- Indexes: No change.
- Triggers: No change.
- Estimated Impact: Low.
*/

-- Drop the previous function if it exists, to ensure a clean state.
DROP FUNCTION IF EXISTS public.ensure_my_aluno_profile(uuid, uuid);

-- Create the new function with a new name.
CREATE OR REPLACE FUNCTION public.get_or_create_client_profile(
    p_arena_id uuid,
    p_profile_id uuid
)
RETURNS alunos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_aluno_record alunos;
    v_profile_record profiles;
BEGIN
    -- Security check: Ensure the calling user matches the profile ID.
    IF auth.uid() != p_profile_id THEN
        RAISE EXCEPTION 'Operation not allowed: You can only manage your own profile.';
    END IF;

    -- Attempt to find an existing aluno record.
    SELECT * INTO v_aluno_record
    FROM public.alunos
    WHERE arena_id = p_arena_id AND profile_id = p_profile_id;

    -- If found, return it.
    IF FOUND THEN
        RETURN v_aluno_record;
    END IF;

    -- If not found, get profile details to create a new aluno record.
    SELECT * INTO v_profile_record
    FROM public.profiles
    WHERE id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for the current user.';
    END IF;

    -- Create the new aluno record.
    INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
    VALUES (p_arena_id, p_profile_id, v_profile_record.name, v_profile_record.email, null, 'ativo', 'Avulso', now())
    RETURNING * INTO v_aluno_record;

    -- Return the newly created record.
    RETURN v_aluno_record;
END;
$$;

-- Grant execution permission to authenticated users.
GRANT EXECUTE ON FUNCTION public.get_or_create_client_profile(uuid, uuid) TO authenticated;
