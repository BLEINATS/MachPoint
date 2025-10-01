-- Remove o gatilho dependente para permitir a alteração da função
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Remove a função com erro
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recria a função com a sintaxe correta
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_new_level_name TEXT;
    v_old_level_name TEXT;
BEGIN
    -- Calcula o novo total de pontos para o aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = NEW.aluno_id;

    -- Obtém o nível atual do aluno
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = NEW.aluno_id;

    -- Encontra o novo nível com base no total de pontos
    SELECT id, name
    INTO v_new_level_id, v_new_level_name
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id
      AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza o total de pontos e o novo nível do aluno
    UPDATE public.alunos
    SET
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = NEW.aluno_id;

    -- Verifica se o nível mudou e cria uma notificação
    IF v_new_level_id IS DISTINCT FROM v_current_level_id THEN
        SELECT name INTO v_old_level_name FROM public.gamification_levels WHERE id = v_current_level_id;

        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT profile_id, NEW.arena_id, 
               'Parabéns! Você subiu para o nível ' || COALESCE(v_new_level_name, 'Novo Nível') || '!',
               'gamification_level_up'
        FROM public.alunos
        WHERE id = NEW.aluno_id AND profile_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o gatilho para manter a automação
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
