/*
# [Function] Create `ensure_aluno_profile_exists`

This function creates a corresponding 'aluno' profile for a user if one does not already exist for a specific arena. This is crucial for allowing clients to make reservations, as the system requires an 'aluno' record to link reservations and credits.

## Query Description:
This operation is safe and non-destructive. It creates a new function `ensure_aluno_profile_exists` that checks for an existing 'aluno' record before creating a new one. This prevents duplicate entries and ensures data integrity. It reads from the `public.profiles` table to populate the new 'aluno' record with the user's name, email, and phone.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the function can be dropped)

## Structure Details:
- Creates a new function: `public.ensure_aluno_profile_exists(p_profile_id uuid, p_arena_id uuid)`

## Security Implications:
- RLS Status: Not applicable to function creation itself.
- Policy Changes: No
- Auth Requirements: The function is defined with `SECURITY DEFINER` to allow it to read from `public.profiles` and write to `public.alunos` with the necessary permissions, even when called by a user with restricted access. This is a standard and secure pattern for this type of operation.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The function performs a quick existence check and a single insert, which is highly performant.
*/

CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(p_profile_id uuid, p_arena_id uuid)
RETURNS void AS $$
DECLARE
    v_aluno_exists boolean;
    v_profile record;
BEGIN
    -- Check if an aluno profile already exists for this user in this arena
    SELECT EXISTS (
        SELECT 1
        FROM public.alunos
        WHERE profile_id = p_profile_id AND arena_id = p_arena_id
    ) INTO v_aluno_exists;

    -- If it doesn't exist, create it
    IF NOT v_aluno_exists THEN
        -- Get user's profile data
        SELECT name, email, phone
        INTO v_profile
        FROM public.profiles
        WHERE id = p_profile_id;

        -- Insert a new record into the alunos table
        INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, plan_name, join_date)
        VALUES (
            p_profile_id,
            p_arena_id,
            v_profile.name,
            v_profile.email,
            v_profile.phone,
            'ativo',
            'Avulso', -- Default plan for new clients
            CURRENT_DATE
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.ensure_aluno_profile_exists(uuid, uuid) TO authenticated;
