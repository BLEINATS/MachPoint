/*
# [SAFE] Fix Function Dependencies for `is_arena_admin`
This script safely updates the `is_arena_admin` function by temporarily dropping and recreating the security policies that depend on it. This resolves a dependency issue that prevents function modification.

## Query Description: [This operation will temporarily remove and re-apply security policies related to gamification management. It is a safe, structural change with no impact on existing data. No backup is required, but it's always a good practice.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops 6 security policies from tables: `gamification_settings`, `gamification_levels`, `gamification_rewards`, `gamification_achievements`, `aluno_achievements`, `gamification_point_transactions`.
- Drops the function `is_arena_admin(uuid)`.
- Recreates the function `is_arena_admin(uuid)` with the correct signature.
- Recreates the 6 security policies, linking them to the new function.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (Drop and Recreate)
- Auth Requirements: Admin privileges required to run this migration.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The operation is very fast and only affects metadata.
*/

-- Step 1: Drop dependent policies
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_settings;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_levels;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_rewards;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_achievements;
DROP POLICY IF EXISTS "Admins can manage their arena's achievements" ON public.aluno_achievements;
DROP POLICY IF EXISTS "Admins can manage point transactions for their arena" ON public.gamification_point_transactions;

-- Step 2: Drop the conflicting function
DROP FUNCTION IF EXISTS public.is_arena_admin(uuid);

-- Step 3: Recreate the function with the correct definition
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
$$;

-- Step 4: Recreate the policies
CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_settings FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_levels FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_rewards FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_achievements FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's achievements"
ON public.aluno_achievements FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.alunos
    WHERE alunos.id = aluno_achievements.aluno_id AND public.is_arena_admin(alunos.arena_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.alunos
    WHERE alunos.id = aluno_achievements.aluno_id AND public.is_arena_admin(alunos.arena_id)
  )
);

CREATE POLICY "Admins can manage point transactions for their arena"
ON public.gamification_point_transactions FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));
