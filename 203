/*
          # [Fix] Corrige a sintaxe da função de atualização de pontos de gamificação
          [Este script corrige um erro de sintaxe (<=) na função 'update_aluno_gamification_points' que impedia a atualização do nível dos alunos. A operação remove e recria o gatilho e a função associada de forma segura.]

          ## Query Description: ["Esta operação corrige a lógica de atualização de pontos e níveis de gamificação. Não há risco de perda de dados, pois a função é recriada com a sintaxe correta e o gatilho é reaplicado."]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Trigger: on_gamification_transaction_change (DROP e CREATE)
          - Function: update_aluno_gamification_points (DROP e CREATE)
          
          ## Security Implications:
          - RLS Status: "N/A"
          - Policy Changes: "No"
          - Auth Requirements: "N/A"
          
          ## Performance Impact:
          - Indexes: "None"
          - Triggers: "Modified"
          - Estimated Impact: "Nenhum impacto de performance esperado. A operação é rápida."
          */
-- Drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_arena_id UUID;
BEGIN
    -- Determine which column triggered the update
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
        v_arena_id := OLD.arena_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
        v_arena_id := NEW.arena_id;
    END IF;

    -- Recalculate total points for the student
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Get the current level of the student
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = v_aluno_id;

    -- Find the new correct level based on total points
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = v_arena_id
    AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the student's profile with the new total points and level
    UPDATE public.alunos
    SET 
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
