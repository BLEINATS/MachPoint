/*
          # [FIX] Corrige a sintaxe da função de atualização de pontos de gamificação
          Este script remove e recria o gatilho e a função `update_aluno_gamification_points` para corrigir um erro de sintaxe que impedia a atualização automática dos pontos e níveis dos clientes.

          ## Query Description: ["Esta operação corrige uma função interna do sistema de gamificação. Não há risco de perda de dados, pois a operação apenas substitui a lógica com erro pela versão correta. O sistema de pontuação voltará a funcionar como esperado após a aplicação."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Afeta a função `update_aluno_gamification_points` e o gatilho `on_gamification_transaction_change`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Nenhum]
          
          ## Performance Impact:
          - Indexes: [Nenhum]
          - Triggers: [Modificado]
          - Estimated Impact: ["Impacto de performance insignificante, pois apenas corrige uma função existente."]
          */

-- Primeiro, remove o gatilho que depende da função.
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Em seguida, remove a função antiga com erro.
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Agora, recria a função com a sintaxe correta.
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INT;
    v_new_level_id UUID;
    v_arena_id UUID;
    v_aluno_id UUID;
BEGIN
    -- Determina qual aluno_id usar com base na operação (INSERT, UPDATE, ou DELETE)
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Obtém o arena_id do registro do aluno
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = v_aluno_id;

    -- Calcula o novo total de pontos para o aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Encontra o novo nível com base no total de pontos
    SELECT id INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = v_arena_id
      AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza a tabela de alunos com o novo total de pontos e nível
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    RETURN NULL; -- O resultado é ignorado, pois este é um gatilho AFTER
END;
$$ LANGUAGE plpgsql;

-- Finalmente, recria o gatilho para chamar a função após qualquer alteração.
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
