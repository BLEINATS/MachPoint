/*
  ================================================================================================
  # [Fix] Corrige a função de atualização de pontos de gamificação
  [Descrição: Este script corrige um erro de sintaxe na função `update_aluno_gamification_points` que impedia o cálculo correto do nível do aluno após uma transação de pontos. O erro era causado por um caractere de comparação (`&lt;=`) que foi salvo incorretamente.

  A correção envolve remover temporariamente o gatilho que usa a função, recriar a função com a sintaxe correta e, em seguida, recriar o gatilho. Isso garante que o sistema de gamificação funcione como esperado.]

  ## Query Description: [Esta operação é segura e não afeta dados existentes. Ela apenas corrige a lógica de uma função interna do sistema de gamificação para que os pontos e níveis dos alunos sejam atualizados corretamente.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Dropping trigger: `on_gamification_transaction_change` on `gamification_point_transactions`
  - Dropping function: `update_aluno_gamification_points`
  - Creating function: `update_aluno_gamification_points`
  - Creating trigger: `on_gamification_transaction_change` on `gamification_point_transactions`
  
  ## Security Implications:
  - RLS Status: [No change]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [Recreated]
  - Estimated Impact: [Nenhum impacto de performance esperado.]
*/

-- Passo 1: Remover o gatilho que depende da função para permitir a alteração.
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Passo 2: Recriar a função com a sintaxe correta e melhores práticas de segurança.
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id UUID;
  v_arena_id UUID;
  v_total_points INT;
  v_new_level_id UUID;
BEGIN
  -- Determina qual ID de aluno usar (da linha nova ou antiga)
  v_aluno_id := COALESCE(NEW.aluno_id, OLD.aluno_id);

  -- Se não houver ID de aluno, não faz nada.
  IF v_aluno_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Busca o arena_id do aluno
  SELECT arena_id INTO v_arena_id
  FROM public.alunos
  WHERE id = v_aluno_id;

  -- Calcula o total de pontos atualizado para o aluno
  SELECT SUM(points)
  INTO v_total_points
  FROM public.gamification_point_transactions
  WHERE aluno_id = v_aluno_id;
  
  -- Garante que o total não seja nulo (caso não haja transações)
  v_total_points := COALESCE(v_total_points, 0);

  -- Encontra o nível correspondente ao novo total de pontos
  SELECT id
  INTO v_new_level_id
  FROM public.gamification_levels
  WHERE arena_id = v_arena_id
  AND points_required <= v_total_points -- Sintaxe corrigida aqui
  ORDER BY points_required DESC
  LIMIT 1;

  -- Atualiza a tabela de alunos com os novos totais e o novo nível
  UPDATE public.alunos
  SET
    gamification_points = v_total_points,
    gamification_level_id = v_new_level_id
  WHERE id = v_aluno_id;

  RETURN NULL;
END;
$$;

-- Passo 3: Recriar o gatilho para que a função seja chamada após cada transação de pontos.
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
