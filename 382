/*
          # [Fix] Corrigir Sintaxe da Função de Atualização de Pontos de Gamificação
          [Este script corrige um erro de sintaxe na função `update_aluno_gamification_points`, garantindo que o cálculo do nível do aluno e a atualização da pontuação total funcionem corretamente após uma transação de pontos.]

          ## Query Description: ["Esta operação corrige uma função existente no banco de dados que estava com um erro de sintaxe. A função é recriada com a lógica correta. Nenhum dado de usuário será perdido ou alterado, e a correção é segura."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Function `update_aluno_gamification_points`
          - Trigger `on_gamification_transaction_change` on table `gamification_point_transactions`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [Modified]
          - Estimated Impact: [Baixo. A correção melhora a integridade da lógica de gamificação.]
          */
-- Remove o gatilho que depende da função com erro
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Remove a função com erro
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recria a função com a sintaxe correta
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_points INT;
    v_new_level_id UUID;
BEGIN
    -- Calcula a nova pontuação total do aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = NEW.aluno_id;

    -- Encontra o novo nível correspondente à pontuação total
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id
      AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza a tabela de alunos com a nova pontuação e o novo nível
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = NEW.aluno_id;

    RETURN NEW;
END;
$$;

-- Recria o gatilho para usar a função corrigida
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
