/*
          # [Operation Name]
          Secure `update_aluno_gamification_points` Function

          ## Query Description: [This operation secures the `update_aluno_gamification_points` trigger function by setting a fixed `search_path` and defining it as `SECURITY DEFINER`. This prevents potential security vulnerabilities related to path manipulation and ensures the function runs with consistent permissions. It also re-establishes the trigger that depends on it. This change is safe and does not affect existing data.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `public.update_aluno_gamification_points()`
          - Trigger: `on_gamification_transaction_change` on `public.gamification_point_transactions`
          
          ## Security Implications:
          - RLS Status: Not changed
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Recreated
          - Estimated Impact: None
          */

-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with the correct syntax and security settings
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
BEGIN
    -- Determine the aluno_id from the triggering table
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_aluno_id := NEW.aluno_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    END IF;

    -- Calculate the new total points for the aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Get the current level of the aluno
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Find the new correct level based on the total points
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id LIMIT 1)
    AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the aluno's total points and level
    UPDATE public.alunos
    SET
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    -- If the level changed, create a notification
    IF v_new_level_id IS DISTINCT FROM v_current_level_id THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT
            profile_id,
            arena_id,
            'Parabéns! Você alcançou o nível ' || (SELECT name FROM public.gamification_levels WHERE id = v_new_level_id) || '!',
            'gamification_level_up'
        FROM public.alunos
        WHERE id = v_aluno_id;
    END IF;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
