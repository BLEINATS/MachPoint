/*
          # [Operação de Limpeza]
          [Este script remove funções de cancelamento antigas e conflitantes e recria a versão final e correta.]

          ## Query Description: ["Este script garante que apenas a função de cancelamento correta exista, prevenindo erros de 'função não existe' ou 'função duplicada' durante as migrações. Não há risco para os dados existentes."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          [Remove as funções 'log_cancellation_credit_in_history', 'cancel_booking', 'secure_client_cancel_function' e recria 'handle_client_cancellation_final'.]
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Remove com segurança todas as versões antigas e conflitantes, se existirem.
DROP FUNCTION IF EXISTS public.log_cancellation_credit_in_history(uuid, uuid, numeric, uuid);
DROP FUNCTION IF EXISTS public.cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.secure_client_cancel_function(uuid);
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

-- Recria a função final e correta
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_credit_amount NUMERIC := 0;
  v_cancellation_policy TEXT;
  v_hours_until_reservation INT;
BEGIN
  -- Busca a reserva para garantir que ela existe e pertence ao usuário
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva não encontrada ou você não tem permissão para cancelá-la.';
  END IF;

  -- Impede o cancelamento de reservas já canceladas ou realizadas
  IF v_reserva.status = 'cancelada' OR v_reserva.status = 'realizada' THEN
    RAISE EXCEPTION 'Esta reserva não pode ser cancelada.';
  END IF;

  -- Calcula a antecedência do cancelamento
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- Aplica a política de cancelamento padrão
  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
    v_cancellation_policy := 'Cancelamento com +24h de antecedência';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
    v_cancellation_policy := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_amount := 0;
    v_cancellation_policy := 'Cancelamento com -12h de antecedência';
  END IF;
  
  -- Atualiza o status da reserva para "cancelada"
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- Se houver crédito a ser concedido, encontra o perfil do aluno e aplica
  IF v_credit_amount > 0 THEN
    SELECT * INTO v_aluno
    FROM public.alunos
    WHERE profile_id = auth.uid() AND arena_id = v_reserva.arena_id;

    IF v_aluno IS NOT NULL THEN
      -- Adiciona o crédito ao saldo do aluno
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_amount
      WHERE id = v_aluno.id;

      -- Registra a transação de crédito
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', v_cancellation_policy, p_reserva_id);
      
      -- Cria notificação para o cliente
      INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
      VALUES (auth.uid(), v_reserva.arena_id, 'Sua reserva foi cancelada e um crédito de ' || v_credit_amount::text || ' foi adicionado à sua conta.', 'credito');
    END IF;
  END IF;

  -- Cria notificação para o admin da arena
  INSERT INTO public.notificacoes (arena_id, message, type)
  VALUES (v_reserva.arena_id, 'A reserva de ' || v_reserva.clientName || ' para ' || to_char(v_reserva.date, 'DD/MM') || ' às ' || v_reserva.start_time::text || ' foi cancelada pelo cliente.', 'cancelamento');
END;
$$;

-- Garante que usuários autenticados possam usar a função
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
