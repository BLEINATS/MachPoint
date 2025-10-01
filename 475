/*
          # [Fix] Corrige Dependência do Gatilho de Gamificação
          [Este script resolve um erro de dependência ao atualizar a função que calcula o total de pontos de um aluno. Ele remove e recria com segurança o gatilho e a função associada.]

          ## Query Description: [Esta operação remove temporariamente um gatilho automático, atualiza a função de cálculo de pontos e recria o gatilho. É um procedimento seguro e não afeta os dados existentes, garantindo que o sistema de pontuação continue funcionando corretamente após a atualização.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Affects trigger: `on_gamification_transaction_change` on table `gamification_point_transactions`
          - Affects function: `update_aluno_gamification_points()`
          
          ## Security Implications:
          - RLS Status: [Not Changed]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Not Changed]
          - Triggers: [Modified]
          - Estimated Impact: [Nenhum impacto de performance esperado. A operação é rápida.]
          */

-- 1. Drop the trigger that depends on the function.
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- 2. Drop the old function.
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- 3. Recreate the function with the correct logic.
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
BEGIN
    -- If a row is inserted or updated, update the target aluno
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.alunos
        SET gamification_points = (
            SELECT COALESCE(SUM(points), 0)
            FROM public.gamification_point_transactions
            WHERE aluno_id = NEW.aluno_id
        )
        WHERE id = NEW.aluno_id;
    -- If a row is deleted, update the old aluno
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.alunos
        SET gamification_points = (
            SELECT COALESCE(SUM(points), 0)
            FROM public.gamification_point_transactions
            WHERE aluno_id = OLD.aluno_id
        )
        WHERE id = OLD.aluno_id;
    END IF;
    RETURN NULL; -- The return value is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger to call the function after any change.
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
