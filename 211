/*
          # [Operation Name]
          Fix Gamification Points Update Function

          ## Query Description: [This operation will correct a syntax error in the function responsible for updating a user's gamification points and level. It safely removes the old trigger and function, then recreates them with the correct logic. This ensures that points and levels are calculated correctly after every transaction.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops and recreates the 'on_gamification_transaction_change' trigger.
          - Drops and recreates the 'update_aluno_gamification_points' function.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Recreated]
          - Estimated Impact: [Negligible. This is a corrective action for a non-functional trigger.]
          */
-- First, drop the dependent trigger
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Then, drop the existing function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Now, recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_new_level_name TEXT;
BEGIN
    -- Determine the aluno_id from the inserted/updated/deleted row
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
        WHERE id = v_aluno_id;
    END IF;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Finally, recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
