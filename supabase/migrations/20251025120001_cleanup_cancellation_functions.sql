/*
# [CLEANUP] Finaliza e Limpa Funções de Cancelamento

[Este script remove todas as versões antigas e conflitantes da função de cancelamento de reserva e recria a versão final e correta. Isso resolve erros de "função não existe" e garante que apenas a lógica correta seja usada.]

## Query Description: [Este script remove funções obsoletas e recria a função de cancelamento de reserva do cliente. Nenhuma tabela é alterada diretamente, apenas a lógica da função.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Funções removidas: cancel_booking, secure_client_cancel_function, etc.
- Função criada/recriada: handle_client_cancellation_final

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Nenhum impacto de performance esperado.]
*/

-- Remove com segurança todas as versões antigas e conflitantes
DROP FUNCTION IF EXISTS public.cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.secure_client_cancel_function(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_with_credit(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_credit_aluno(uuid);
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);


-- Recria a função final e correta
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva record;
  v_aluno record;
  v_credit_to_add numeric := 0;
  v_hours_until_reservation integer;
  v_cancellation_reason text;
BEGIN
  -- 1. Buscar a reserva e verificar a permissão
  SELECT *
  INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada ou você não tem permissão para cancelá-la.';
  END IF;

  IF v_reserva.status = 'cancelada' THEN
    RETURN 'Esta reserva já foi cancelada.';
  END IF;

  -- 2. Buscar o perfil do aluno correspondente
  SELECT *
  INTO v_aluno
  FROM public.alunos
  WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de cliente não encontrado para esta arena.';
  END IF;

  -- 3. Calcular o crédito com base na política de cancelamento
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  IF v_hours_until_reservation >= 24 THEN
    v_credit_to_add := v_reserva.total_price;
    v_cancellation_reason := 'Cancelamento com +24h';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_to_add := v_reserva.total_price * 0.5;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_to_add := 0;
    v_cancellation_reason := 'Cancelamento com -12h';
  END IF;

  -- 4. Atualizar o status da reserva
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. Adicionar crédito (se aplicável)
  IF v_credit_to_add > 0 THEN
    -- Chama a função RPC para adicionar crédito de forma segura
    PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_to_add);

    -- Insere o registro da transação de crédito
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
  END IF;

  -- 6. Enviar notificação para o cliente
  INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
  VALUES (v_reserva.profile_id, v_reserva.arena_id, 'Sua reserva para ' || to_char(v_reserva.date, 'DD/MM') || ' às ' || to_char(v_reserva.start_time, 'HH24:MI') || ' foi cancelada. Crédito de ' || v_credit_to_add::text || ' adicionado.', 'cancelamento');

  -- 7. Enviar notificação para a arena
  INSERT INTO public.notificacoes (arena_id, message, type)
  VALUES (v_reserva.arena_id, 'Reserva de ' || v_reserva.clientName || ' para ' || to_char(v_reserva.date, 'DD/MM') || ' às ' || to_char(v_reserva.start_time, 'HH24:MI') || ' foi cancelada pelo cliente.', 'cancelamento');

  RETURN 'Reserva cancelada com sucesso. Crédito (se aplicável) foi adicionado à sua conta.';
END;
$$;

-- Garante que usuários autenticados possam chamar a função
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
