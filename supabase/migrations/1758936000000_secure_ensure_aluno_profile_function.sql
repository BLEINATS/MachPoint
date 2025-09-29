/*
  # [SECURITY] Secure ensure_aluno_profile function

  [This migration secures the `ensure_aluno_profile` function by setting a fixed `search_path`. This prevents potential hijacking attacks by ensuring the function does not use a mutable search path, resolving a security advisory warning.]

  ## Query Description: [This operation redefines the `ensure_aluno_profile` function to enhance security. It is a non-destructive change that only affects the function's definition and has no impact on existing data. It is fully reversible by redeploying the previous version of the function.]

  ## Metadata:
  - Schema-Category: ["Structural", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Function `public.ensure_aluno_profile(uuid, uuid)` will be dropped and recreated.

  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  - Mitigates: [Function Search Path Mutable]

  ## Performance Impact:
  - Indexes: [Not Applicable]
  - Triggers: [Not Applicable]
  - Estimated Impact: [None. This is a definitional change with no performance overhead.]
*/
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS TABLE (
    id uuid,
    arena_id uuid,
    profile_id uuid,
    name text,
    email text,
    phone text,
    status text,
    sport text,
    plan_name text,
    monthly_fee numeric,
    join_date date,
    created_at timestamptz,
    avatar_url text,
    credit_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_aluno public.alunos;
    v_profile public.profiles;
BEGIN
    -- Find existing aluno profile
    SELECT * INTO v_aluno FROM public.alunos WHERE alunos.profile_id = p_profile_id AND alunos.arena_id = p_arena_id;

    -- If not found, create one
    IF v_aluno.id IS NULL THEN
        -- Get user details from profiles table
        SELECT * INTO v_profile FROM public.profiles WHERE profiles.id = p_profile_id;

        -- Insert into alunos table
        INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
        VALUES (p_arena_id, p_profile_id, v_profile.name, v_profile.email, v_profile.phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING * INTO v_aluno;
    END IF;

    -- Return the found or newly created aluno profile
    RETURN QUERY SELECT a.id, a.arena_id, a.profile_id, a.name, a.email, a.phone, a.status, a.sport, a.plan_name, a.monthly_fee, a.join_date, a.created_at, a.avatar_url, a.credit_balance FROM public.alunos a WHERE a.id = v_aluno.id;
END;
$$;
