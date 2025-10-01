/*
  # [Operation Name]
  Recreate Missing Function `create_my_aluno_profile`

  ## Query Description:
  This script recreates the `create_my_aluno_profile` function, which is essential for new clients to create their profile within an arena. The original function was reported as missing, causing errors. This version ensures that a client can create their arena-specific profile, pulling data from their main user profile, and prevents the creation of duplicate profiles.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Creates a new RPC function `public.create_my_aluno_profile(p_arena_id UUID)`.

  ## Security Implications:
  - RLS Status: The function runs with the privileges of the user who calls it (`SECURITY INVOKER`). RLS policies on the `alunos` and `profiles` tables will be enforced.
  - Policy Changes: No
  - Auth Requirements: The user must be authenticated.

  ## Performance Impact:
  - Indexes: The function benefits from indexes on `alunos(profile_id, arena_id)`.
  - Triggers: No new triggers.
  - Estimated Impact: Low. The function is called infrequently (on profile creation per arena).
*/
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Runs as the calling user, enforcing RLS
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_user_profile record;
BEGIN
  -- 1. Get the user's main profile data
  SELECT name, email, phone
  INTO v_user_profile
  FROM public.profiles
  WHERE id = v_profile_id;

  -- If the user has no main profile, they can't create an aluno profile.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found. Cannot create arena profile.';
  END IF;

  -- 2. Insert into 'alunos' table if a profile for this arena doesn't exist yet
  INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, plan_name, join_date)
  SELECT
    v_profile_id,
    p_arena_id,
    v_user_profile.name,
    v_user_profile.email,
    v_user_profile.phone,
    'ativo',           -- Default status
    'Avulso',          -- Default plan
    CURRENT_DATE       -- Default join date
  ON CONFLICT (profile_id, arena_id) DO NOTHING; -- Prevents creating duplicates silently

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_my_aluno_profile(uuid) TO authenticated;
