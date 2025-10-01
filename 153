/*
          # [Fix Function Dependencies]
          Corrige a função `is_arena_admin` que estava bloqueada por dependências de políticas de segurança (RLS).

          ## Query Description: [Este script primeiro remove as políticas de RLS que dependem da função `is_arena_admin`, depois atualiza a função e, por fim, recria as políticas de forma segura. Isso é necessário para evitar quebras no sistema de segurança do banco de dados ao modificar uma função em uso.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops and recreates 6 RLS policies on gamification tables.
          - Drops and recreates the `is_arena_admin` function.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Nenhum impacto de performance esperado. A operação é rápida e afeta apenas a definição de metadados.]
          */

-- Step 1: Drop a política da tabela gamification_settings
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_settings;

-- Step 2: Drop a política da tabela gamification_levels
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_levels;

-- Step 3: Drop a política da tabela gamification_rewards
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_rewards;

-- Step 4: Drop a política da tabela gamification_achievements
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_achievements;

-- Step 5: Drop a política da tabela aluno_achievements
DROP POLICY IF EXISTS "Admins can manage their arena's achievements" ON public.aluno_achievements;

-- Step 6: Drop a política da tabela gamification_point_transactions
DROP POLICY IF EXISTS "Admins can manage point transactions for their arena" ON public.gamification_point_transactions;

-- Step 7: Drop a função antiga que está causando o conflito
DROP FUNCTION IF EXISTS public.is_arena_admin(uuid);

-- Step 8: Recrie a função com a assinatura e lógica corretas
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.arenas
      WHERE id = p_arena_id AND owner_id = auth.uid()
    );
  END IF;
  RETURN false;
END;
$$;

-- Step 9: Recrie as políticas que foram removidas

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
USING (EXISTS (
    SELECT 1 FROM public.alunos
    WHERE alunos.id = aluno_achievements.aluno_id AND public.is_arena_admin(alunos.arena_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.alunos
    WHERE alunos.id = aluno_achievements.aluno_id AND public.is_arena_admin(alunos.arena_id)
));

CREATE POLICY "Admins can manage point transactions for their arena"
ON public.gamification_point_transactions FOR ALL
USING (public.is_arena_admin(arena_id))
WITH CHECK (public.is_arena_admin(arena_id));
