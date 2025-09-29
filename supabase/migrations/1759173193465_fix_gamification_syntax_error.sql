/*
# [Fix] Corrige a sintaxe da função de atualização de pontos de gamificação

Este script corrige um erro de sintaxe na função `update_aluno_gamification_points` que impedia a atualização automática dos pontos e níveis dos clientes. A operação é segura e consiste em recriar a função e seu gatilho associado com a lógica correta.

## Query Description: "Este script recria a função de atualização de pontos de gamificação para corrigir um erro de sintaxe. A operação é segura e não afeta dados existentes, apenas a lógica de automação."

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Trigger: on_gamification_transaction_change (recriado)
- Function: update_aluno_gamification_points (recriada)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: Admin

## Performance Impact:
- Indexes: None
- Triggers: Recreated
- Estimated Impact: Baixo. A função é executada apenas em transações de pontos.
*/

-- Passo 1: Remover o gatilho que depende da função com erro.
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Passo 2: Remover a função com erro.
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Passo 3: Recriar a função com a sintaxe correta.
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_new_level_name TEXT;
    v_aluno_id UUID;
BEGIN
    -- Determina qual aluno_id usar baseado na operação (INSERT, UPDATE, DELETE)
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Recalcula o total de pontos para o aluno específico
    SELECT SUM(points) INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Obtém o nível atual do aluno
    SELECT gamification_level_id INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Encontra o novo nível correto baseado no novo total de pontos
    SELECT id, name INTO v_new_level_id, v_new_level_name
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id LIMIT 1)
      AND points_required &lt;= COALESCE(v_total_points, 0)
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza o total de pontos e o nível do aluno na tabela 'alunos'
    UPDATE public.alunos
    SET 
        gamification_points = COALESCE(v_total_points, 0),
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    -- Se o nível mudou, cria uma notificação
    IF v_new_level_id IS DISTINCT FROM v_current_level_id AND v_new_level_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT profile_id, arena_id, 'Parabéns! Você subiu para o nível ' || v_new_level_name || '!', 'gamification_level_up'
        FROM public.alunos
        WHERE id = v_aluno_id;
    END IF;

    RETURN NULL; -- O resultado é ignorado para triggers AFTER
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Passo 4: Recriar o gatilho para executar a função após cada transação de pontos.
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
