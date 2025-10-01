/*
          # [Fix] Corrige dependências da função is_arena_admin
          [Este script remove temporariamente as políticas de segurança que dependem da função 'is_arena_admin', atualiza a função e recria as políticas. Isso é necessário para evitar erros de dependência ao modificar a função.]

          ## Query Description: [Este script é seguro. Ele preserva as regras de segurança existentes, apenas as recriando para apontar para a versão atualizada da função. Não há risco de perda de dados.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Funções afetadas: is_arena_admin
          - Políticas afetadas: Políticas de gerenciamento de gamificação em várias tabelas.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Nenhum]
          
          ## Performance Impact:
          - Indexes: [Nenhum]
          - Triggers: [Nenhum]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
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

-- Step 7: Agora que as dependências foram removidas, drop a função antiga.
DROP FUNCTION IF EXISTS public.is_arena_admin(uuid);

-- Step 8: Recrie a função com a definição correta.
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

-- Step 9: Recrie as políticas de segurança que foram removidas.

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_settings
FOR ALL
USING (is_arena_admin(arena_id))
WITH CHECK (is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_levels
FOR ALL
USING (is_arena_admin(arena_id))
WITH CHECK (is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_rewards
FOR ALL
USING (is_arena_admin(arena_id))
WITH CHECK (is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_achievements
FOR ALL
USING (is_arena_admin(arena_id))
WITH CHECK (is_arena_admin(arena_id));

CREATE POLICY "Admins can manage their arena's achievements"
ON public.aluno_achievements
FOR ALL
USING (is_arena_admin((SELECT arena_id FROM public.alunos WHERE id = aluno_id)))
WITH CHECK (is_arena_admin((SELECT arena_id FROM public.alunos WHERE id = aluno_id)));

CREATE POLICY "Admins can manage point transactions for their arena"
ON public.gamification_point_transactions
FOR ALL
USING (is_arena_admin(arena_id))
WITH CHECK (is_arena_admin(arena_id));
