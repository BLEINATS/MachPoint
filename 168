/*
# [Fix] Corrige Dependências e Recria Função de Cancelamento de Cliente
Este script resolve um erro de migração causado por dependências em funções de cancelamento antigas ou inexistentes. Ele limpa funções obsoletas e recria a função `handle_client_cancellation_final` de forma segura e com a lógica de negócio correta.

## Query Description:
- **DROP FUNCTION IF EXISTS**: Remove com segurança várias versões antigas da função de cancelamento, evitando erros de "função não existe".
- **CREATE OR REPLACE FUNCTION handle_client_cancellation_final**: Recria a função principal de cancelamento pelo cliente.
  - **Segurança**: A função é `SECURITY DEFINER` para garantir que ela possa atualizar tabelas com as permissões corretas, mas a lógica interna verifica se o usuário autenticado (`auth.uid()`) é o dono da reserva, mantendo a segurança.
  - **Lógica de Crédito**: A política de cancelamento (100% de crédito para +24h, 50% para 12-24h, 0% para -12h) é calculada e aplicada no backend, garantindo consistência.
  - **Transações Atômicas**: As atualizações na reserva, no saldo de crédito e no histórico de transações são feitas de forma coesa.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops functions: `secure_client_cancel_function`, `cancel_reservation_for_client`, `client_cancel_reservation`.
- Creates/Replaces function: `handle_client_cancellation_final(uuid)`.

## Security Implications:
- RLS Status: A função interage com tabelas que possuem RLS.
- Policy Changes: No.
- Auth Requirements: A função verifica a identidade do chamador (`auth.uid()`).
- Search Path: `search_path` é definido como `public` para mitigar riscos de segurança.

## Performance Impact:
- Indexes: No change.
- Triggers: No change.
- Estimated Impact: Baixo. A execução da função é rápida.
*/

-- Step 1: Drop old and conflicting functions safely
DROP FUNCTION IF EXISTS public.secure_client_cancel_function(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_for_client(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation(uuid);

-- Step 2: Create or replace the final, correct cancellation function
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva record;
  v_aluno record;
  v_credit_to_add numeric := 0;
  v_hours_until_reservation int;
  v_cancellation_reason text;
BEGIN
  -- Get the reservation details and ensure the caller is the owner
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  -- If no reservation is found for the user, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada ou você não tem permissão para cancelá-la.';
  END IF;

  -- Prevent cancellation of already cancelled or completed reservations
  IF v_reserva.status IN ('cancelada', 'realizada') THEN
    RAISE EXCEPTION 'Esta reserva não pode ser cancelada.';
  END IF;

  -- Calculate hours until the reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- Apply cancellation policy
  IF v_hours_until_reservation >= 24 THEN
    v_credit_to_add := v_reserva.total_price;
    v_cancellation_reason := 'Cancelamento com +24h de antecedência';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_to_add := v_reserva.total_price * 0.5;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_to_add := 0;
    v_cancellation_reason := 'Cancelamento com -12h de antecedência';
  END IF;

  -- Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- If credit is to be added, process it
  IF v_credit_to_add > 0 THEN
    -- Find the corresponding 'aluno' profile to add credit to
    SELECT * INTO v_aluno
    FROM public.alunos
    WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

    IF FOUND THEN
      -- Add credit to the aluno's balance
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_to_add
      WHERE id = v_aluno.id;

      -- Log the credit transaction
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
    ELSE
      RAISE WARNING 'Perfil de aluno não encontrado para adicionar crédito. Profile ID: %, Arena ID: %', v_reserva.profile_id, v_reserva.arena_id;
    END IF;
  END IF;

  -- Insert a notification for the client
  INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
  VALUES (v_reserva.profile_id, v_reserva.arena_id, 'Sua reserva para ' || to_char(v_reserva.date, 'DD/MM') || ' às ' || to_char(v_reserva.start_time, 'HH24:MI') || ' foi cancelada.', 'cancelamento');

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
