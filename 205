-- Remove o gatilho dependente para permitir a alteração da função
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Remove a função antiga para evitar conflitos
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recria a função com a sintaxe correta
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_aluno_id UUID;
    v_arena_id UUID;
BEGIN
    -- Determina qual ID usar (INSERT, UPDATE, ou DELETE)
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
        v_arena_id := OLD.arena_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
        v_arena_id := NEW.arena_id;
    END IF;

    -- Recalcula o total de pontos para o aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Obtém o nível atual do aluno
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Determina o novo nível com base no total de pontos
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = v_arena_id
    AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Atualiza a tabela de alunos com o novo total de pontos e o novo nível
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    -- Se o nível mudou, cria uma notificação
    IF v_new_level_id IS DISTINCT FROM v_current_level_id THEN
        DECLARE
            v_new_level_name TEXT;
            v_profile_id UUID;
        BEGIN
            SELECT name INTO v_new_level_name FROM public.gamification_levels WHERE id = v_new_level_id;
            SELECT profile_id INTO v_profile_id FROM public.alunos WHERE id = v_aluno_id;

            IF v_profile_id IS NOT NULL AND v_new_level_name IS NOT NULL THEN
                INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
                VALUES (v_profile_id, v_arena_id, 'Parabéns! Você alcançou o nível ' || v_new_level_name || '!', 'gamification_level_up');
            END IF;
        END;
    END IF;

    RETURN NULL; -- O resultado é ignorado para triggers AFTER
END;
$function$;

-- Recria o gatilho para usar a função corrigida
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
