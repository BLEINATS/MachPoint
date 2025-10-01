/*
          # [DEFINITIVE FIX] Corrige a sintaxe da função de atualização de pontos de gamificação
          [Este script remove o gatilho e a função com erro de sintaxe e os recria corretamente.
          O erro 'syntax error at or near "="' é causado por uma má interpretação do caractere '<=' durante a migração.
          Esta versão garante que a lógica de atualização de nível e pontos funcione como esperado.]

          ## Query Description: [Esta operação é segura. Ela reconstrói uma função interna do sistema de gamificação para corrigir um erro de sintaxe. Nenhum dado de usuário será afetado.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - DROP TRIGGER on_gamification_transaction_change
          - DROP FUNCTION update_aluno_gamification_points
          - CREATE FUNCTION update_aluno_gamification_points
          - CREATE TRIGGER on_gamification_transaction_change
          
          ## Security Implications:
          - RLS Status: [No change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Recreated]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Drop the existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
    v_aluno_id UUID;
BEGIN
    -- Determine which column to use (INSERT, UPDATE, or DELETE)
    IF TG_OP = 'DELETE' THEN
        v_aluno_id := OLD.aluno_id;
    ELSE
        v_aluno_id := NEW.aluno_id;
    END IF;

    -- Recalculate total points for the specific aluno
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

    RETURN NULL; -- The result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
