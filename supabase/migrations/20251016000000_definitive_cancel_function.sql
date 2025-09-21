/*
          # [Function] handle_client_cancellation
          [Cria uma função única e segura para que clientes cancelem suas próprias reservas, apliquem créditos e registrem a transação, tudo em uma única operação. Remove todas as funções de cancelamento antigas para evitar conflitos.]

          ## Query Description: [Esta operação limpa funções de cancelamento antigas e cria uma nova e mais segura. Não há risco de perda de dados. É uma refatoração para corrigir um erro persistente de permissão e cache.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Funções Removidas: cancel_reservation_and_apply_credit, cancel_reservation_and_get_credit, client_cancel_reservation_by_id, cancel_my_booking, client_cancel_booking, cancel_booking_as_client (e suas variações v2, v3, etc.)
          - Função Criada: handle_client_cancellation(uuid)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [A nova função usa SECURITY INVOKER, rodando com as permissões do usuário logado, o que é mais seguro.]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Limpa todas as funções de cancelamento anteriores para evitar conflitos de cache e nome.
DROP FUNCTION IF EXISTS public.cancel_reservation_and_apply_credit(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_apply_credit_v2(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_apply_credit_v3(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);
DROP FUNCTION IF EXISTS public.cancel_my_booking(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_as_client(uuid);

-- Cria a nova função definitiva e segura
CREATE OR REPLACE FUNCTION public.handle_client_cancellation(p_reserva_id uuid)
RETURNS void AS $$
DECLARE
  v_reserva public.reservas;
  v_aluno public.alunos;
  v_arena public.arenas;
  v_credit_amount numeric := 0;
  v_hours_until_reservation numeric;
BEGIN
  -- 1. Busca a reserva e garante que o usuário logado é o dono.
  -- A política de RLS na tabela 'reservas' já deve garantir isso, mas é uma dupla checagem.
  SELECT *
  INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Permissão negada ou reserva não encontrada.';
  END IF;

  -- 2. Busca a arena para obter a política de cancelamento (lógica de crédito).
  SELECT *
  INTO v_arena
  FROM public.arenas
  WHERE id = v_reserva.arena_id;

  IF v_arena IS NULL THEN
    RAISE EXCEPTION 'Arena não encontrada para esta reserva.';
  END IF;

  -- 3. Calcula o valor do crédito com base na antecedência.
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
  ELSE
    v_credit_amount := 0;
  END IF;

  -- 4. Atualiza o status da reserva para 'cancelada'.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. Se houver crédito a ser dado, encontra o perfil de aluno e aplica.
  IF v_credit_amount > 0 THEN
    SELECT *
    INTO v_aluno
    FROM public.alunos
    WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

    IF v_aluno IS NOT NULL THEN
      -- Adiciona o crédito ao saldo do aluno.
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_amount
      WHERE id = v_aluno.id;

      -- Registra a transação de crédito.
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id, auth.uid());
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Garante que usuários autenticados possam executar esta função.
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation(uuid) TO authenticated;
