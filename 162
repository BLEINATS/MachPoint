/*
          # [Fix] Corrige Dependência do Gatilho de Conclusão de Reserva
          [Este script remove e recria com segurança o gatilho e a função responsáveis por adicionar pontos de gamificação quando uma reserva é concluída. Isso resolve um erro de dependência que impedia a atualização da função.]

          ## Query Description: [Esta operação é segura e não afeta dados existentes. Ela apenas reestrutura objetos do banco de dados para permitir atualizações futuras e corrigir a lógica interna da função.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops trigger: `on_reservation_completed_add_points` on table `reservas`
          - Drops function: `handle_reservation_completion()`
          - Recreates function: `handle_reservation_completion()`
          - Recreates trigger: `on_reservation_completed_add_points` on table `reservas`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [Modified]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- 1. Remove o gatilho dependente
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- 2. Remove a função antiga
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 3. Recria a função com a lógica correta e segura
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id UUID;
  v_arena_id UUID;
  v_points_per_reservation INT;
  v_points_per_real INT;
  v_total_price REAL;
  v_points_to_add INT;
  v_gamification_is_enabled BOOLEAN;
BEGIN
  -- Verifica se o status da reserva mudou para 'realizada'
  IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
    -- Obtém o aluno_id e arena_id da reserva
    v_aluno_id := NEW.aluno_id;
    v_arena_id := NEW.arena_id;
    v_total_price := COALESCE(NEW.total_price, 0);

    -- Prossiga apenas se houver um aluno associado
    IF v_aluno_id IS NOT NULL THEN
      -- Verifica se a gamificação está habilitada para a arena
      SELECT is_enabled, points_per_reservation, points_per_real
      INTO v_gamification_is_enabled, v_points_per_reservation, v_points_per_real
      FROM public.gamification_settings
      WHERE arena_id = v_arena_id;

      -- Se a gamificação estiver habilitada, calcula e adiciona os pontos
      IF v_gamification_is_enabled THEN
        v_points_to_add := v_points_per_reservation + floor(v_total_price * v_points_per_real);
        
        -- Adiciona os pontos usando a função dedicada
        IF v_points_to_add > 0 THEN
          PERFORM public.add_gamification_points(
            p_aluno_id := v_aluno_id,
            p_points_to_add := v_points_to_add,
            p_description := 'Conclusão da reserva #' || substr(NEW.id::text, 1, 8),
            p_transaction_type := 'reservation_completed',
            p_related_reservation_id := NEW.id
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Recria o gatilho para chamar a nova função
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
