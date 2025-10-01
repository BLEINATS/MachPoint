/*
# [SECURITY] Set explicit search_path for functions

## Query Description: This operation updates existing database functions to explicitly set the `search_path`. This is a security best practice to prevent hijacking attacks by ensuring functions resolve objects (tables, types, etc.) from expected schemas, mitigating risks from mutable user-defined search paths. This change does not alter function logic or data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions being altered:
  - `ensure_aluno_profile(uuid, uuid)`
  - `is_arena_admin(uuid)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Hijacking attacks via mutable search_path.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Function execution might be marginally faster due to a fixed search path.
*/

-- Function: ensure_aluno_profile
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS TABLE(id uuid, arena_id uuid, profile_id uuid, name text, email text, phone text, status public.aluno_status, sport text, plan_name text, monthly_fee real, join_date date, created_at timestamp with time zone, avatar_url text, credit_balance real, gamification_points integer, gamification_level_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno public.alunos;
BEGIN
    -- Try to find an existing aluno record
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If not found, create one from the profile
    IF v_aluno.id IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, plan_name, join_date)
        SELECT p.id, p_arena_id, p.name, p.email, p.phone, 'ativo'::public.aluno_status, 'Avulso', CURRENT_DATE
        FROM public.profiles p
        WHERE p.id = p_profile_id
        RETURNING * INTO v_aluno;
    END IF;

    -- Return the found or newly created aluno profile
    RETURN QUERY SELECT a.id, a.arena_id, a.profile_id, a.name, a.email, a.phone, a.status, a.sport, a.plan_name, a.monthly_fee, a.join_date, a.created_at, a.avatar_url, a.credit_balance, a.gamification_points, a.gamification_level_id FROM public.alunos a WHERE a.id = v_aluno.id;
END;
$$;

-- Function: is_arena_admin
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
END;
$$;
