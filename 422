/*
          # [Fix] Corrige a sintaxe da função de atualização de pontos de gamificação
          [Este script corrige um erro de sintaxe na função `update_aluno_gamification_points` que impedia a atualização correta do nível do aluno após uma transação de pontos. A operação é segura e restaura a funcionalidade pretendida.]

          ## Query Description: ["This operation corrects a syntax error in the `update_aluno_gamification_points` function, which was preventing the correct update of a student's level after a points transaction. The operation is safe and restores the intended functionality."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [Affects the function `update_aluno_gamification_points` and the trigger `on_gamification_transaction_change` on the `gamification_point_transactions` table.]
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [Modified]
          - Estimated Impact: [Negligible performance impact. Corrects a non-functional trigger.]
          */

-- Remove o gatilho dependente para permitir a alteração da função
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Remove a função com erro
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recria a função com a sintaxe correta
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_total_points INT;
    v_new_level_id UUID;
BEGIN
    -- Determina qual coluna (OLD ou NEW) contém o aluno_id relevante
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Calcula a nova pontuação total para o aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Encontra o novo nível correspondente à pontuação total
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id)
    AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza a pontuação total e o nível do aluno na tabela 'alunos'
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    RETURN NULL; -- O resultado é ignorado para triggers AFTER
END;
$$ LANGUAGE plpgsql;

-- Recria o gatilho para usar a função corrigida
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
