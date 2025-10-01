-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;
AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_new_level_name TEXT;
    v_aluno_id UUID;
BEGIN
    -- Determine which ID to use based on the operation
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Recalculate the total points for the aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Get the current level of the aluno
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Find the new correct level based on the new total points
    SELECT id, name
    INTO v_new_level_id, v_new_level_name
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id LIMIT 1)
      AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the aluno's total points and level
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    -- If the level has changed, create a notification
    IF v_new_level_id IS DISTINCT FROM v_current_level_id AND v_new_level_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT profile_id, arena_id, 'Parabéns! Você subiu para o nível ' || v_new_level_name || '!', 'gamification_level_up'
        FROM public.alunos
        WHERE id = v_aluno_id AND profile_id IS NOT NULL;
    END IF;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_aluno_gamification_points() TO authenticated;
