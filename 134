/*
          # [Fix] Definitive Aluno Profile Creation
          [This is a consolidated script to fix the previous migration errors. It creates the necessary database function `ensure_my_aluno_profile` and grants the correct permissions, resolving the "function does not exist" error.]

          ## Query Description: [This script will create (or replace) the function responsible for creating a client's profile ('aluno' record) during their first reservation. It then grants the 'authenticated' role the permission to execute this function. This is a safe, idempotent operation that will fix the reservation saving issue.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Functions created/replaced: 'ensure_my_aluno_profile(uuid, uuid)'
          - Permissions granted: EXECUTE on the function to the 'authenticated' role.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Negligible]
          */

-- Step 1: Create or replace the function to ensure it exists and is correct.
CREATE OR REPLACE FUNCTION public.ensure_my_aluno_profile(p_arena_id uuid, p_profile_id uuid)
RETURNS public.alunos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno public.alunos;
    v_profile public.profiles;
BEGIN
    -- Check if the aluno record already exists for this profile and arena
    SELECT * INTO v_aluno
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If it exists, return it
    IF FOUND THEN
        RETURN v_aluno;
    END IF;

    -- If not, fetch the profile details
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_profile_id;

    -- If profile doesn't exist, we can't proceed
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile with id % not found', p_profile_id;
    END IF;

    -- Create the new aluno record
    INSERT INTO public.alunos (arena_id, profile_id, name, email, status, plan_name, join_date)
    VALUES (p_arena_id, p_profile_id, v_profile.name, v_profile.email, 'ativo', 'Avulso', NOW())
    RETURNING * INTO v_aluno;

    RETURN v_aluno;
END;
$$;

-- Step 2: Grant execute permission to the authenticated role.
-- This will now succeed because the function is guaranteed to exist from Step 1.
GRANT EXECUTE ON FUNCTION public.ensure_my_aluno_profile(uuid, uuid) TO authenticated;
