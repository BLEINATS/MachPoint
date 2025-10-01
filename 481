/*
  # [Fix] Corrige a função de atualização de pontos de gamificação

  ## Descrição da Query:
  Esta migração corrige um erro de sintaxe na função `update_aluno_gamification_points` que impedia a atualização correta dos pontos e níveis dos clientes. O script primeiro remove o gatilho e a função com erro, depois recria ambos com a sintaxe correta, garantindo que o sistema de gamificação funcione como esperado.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true

  ## Detalhes da Estrutura:
  - Afeta a função `update_aluno_gamification_points` e o gatilho `on_gamification_transaction_change`.

  ## Implicações de Segurança:
  - RLS Status: Inalterado
  - Policy Changes: Não
  - Auth Requirements: N/A

  ## Impacto de Performance:
  - Indexes: Nenhum
  - Triggers: Recriado
  - Estimated Impact: Baixo. A função é executada apenas quando os pontos de um cliente mudam.
*/

-- Step 1: Drop the dependent trigger first
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Step 2: Drop the faulty function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Step 3: Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_new_level_name TEXT;
BEGIN
    -- Calculate the new total points for the aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = NEW.aluno_id;

    -- Get the current level of the aluno before the update
    SELECT gamification_level_id
    INTO v_current_level_id
    FROM public.alunos
    WHERE id = NEW.aluno_id;

    -- Find the new level based on the total points
    -- It selects the highest level that the user qualifies for
    SELECT id, name
    INTO v_new_level_id, v_new_level_name
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id
    AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the aluno's total points and new level
    UPDATE public.alunos
    SET
        gamification_points = v_total_points,
        gamification_level_id = v_new_level_id
    WHERE id = NEW.aluno_id;

    -- If the level has changed, create a notification
    IF v_new_level_id IS DISTINCT FROM v_current_level_id AND v_new_level_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
        SELECT profile_id, NEW.arena_id, 'Parabéns! Você subiu para o nível ' || v_new_level_name || '!', 'gamification_level_up'
        FROM public.alunos
        WHERE id = NEW.aluno_id AND profile_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger to use the new function
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
