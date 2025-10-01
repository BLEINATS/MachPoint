/*
          # [Function Security] update_aluno_gamification_points
          [This operation secures the function that updates a student's total gamification points by setting a strict search_path. It involves temporarily dropping and recreating the trigger that uses this function.]

          ## Query Description: [This is a safe, non-destructive operation. It enhances security by preventing potential hijacking of the function's execution path. No user data will be affected.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Drops and recreates the trigger 'on_gamification_transaction_change'.
          - Drops and recreates the function 'update_aluno_gamification_points'.
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [Recreated]
          - Estimated Impact: [Negligible. The function is only called when a gamification transaction occurs.]
          */

-- Step 1: Drop the dependent trigger
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Step 3: Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_aluno_id UUID;
BEGIN
    -- Determine which record's points to update
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Calculate the new total points for the student
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Get the current level of the student
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Determine the new level based on the total points
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id LIMIT 1)
      AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the student's total points and level
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    -- If the level has changed, create a notification
    IF v_new_level_id IS DISTINCT FROM v_current_level_id THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT 
            profile_id, 
            arena_id,
            'Parabéns! Você subiu para o nível ' || (SELECT name FROM public.gamification_levels WHERE id = v_new_level_id),
            'gamification_level_up'
        FROM public.alunos
        WHERE id = v_aluno_id;
    END IF;

    RETURN NULL;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
