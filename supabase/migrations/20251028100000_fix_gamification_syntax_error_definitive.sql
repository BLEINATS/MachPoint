/*
# [Fix] Corrige erro de sintaxe na função de atualização de pontos de gamificação
Este script corrige um erro de sintaxe recorrente na função `update_aluno_gamification_points` que impedia a aplicação de migrações. O erro era causado por um caractere malformado (`&lt;=`). Esta versão remove a automação (gatilho) e a função com erro, e as recria com a sintaxe correta, garantindo que o cálculo de pontos e níveis de gamificação funcione como esperado.

## Query Description: "This operation will safely recreate a database function to fix a syntax error. It temporarily removes a trigger, updates the function, and then restores the trigger. There is no risk of data loss, and the change is essential for the gamification system to work correctly."

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops and recreates trigger: `on_gamification_transaction_change` on table `gamification_point_transactions`
- Drops and recreates function: `update_aluno_gamification_points()`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Unchanged
- Triggers: Recreated
- Estimated Impact: "Negligible performance impact. The trigger is essential for data consistency in the gamification system."
*/

-- Step 1: Drop the dependent trigger
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Step 3: Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_total_points INT;
    v_new_level_id UUID;
BEGIN
    -- Determine the aluno_id from the changed row
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Recalculate total points for the affected aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = v_aluno_id;

    -- Find the new correct level based on the new total points
    -- It selects the highest level for which the user has enough points
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = (SELECT arena_id FROM public.alunos WHERE id = v_aluno_id LIMIT 1)
      AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the alunos table with the new total points and new level
    UPDATE public.alunos
    SET
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = v_aluno_id;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
