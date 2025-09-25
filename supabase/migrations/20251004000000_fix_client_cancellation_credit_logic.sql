-- 1. Drop a função antiga para garantir que estamos substituindo-a completamente.
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

-- 2. Recria a função com a lógica corrigida e mais robusta.
/*
# [Function] handle_client_cancellation_final (Definitive Fix)
Cancela uma reserva de cliente e garante a aplicação do crédito, mesmo que o cliente não tenha um perfil de 'aluno' pré-existente.

## Query Description: [This function replaces the previous cancellation logic. It now robustly handles credit application by first checking for an 'aluno' profile. If one doesn't exist for the cancelling user, it creates one on the fly before applying the cancellation credit. This ensures that credit is never lost and fixes the bug where credit was not appearing for some users.]
## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]
## Structure Details:
- Tables affected: public.reservas, public.alunos, public.credit_transactions
- Operations: UPDATE on 'reservas', potential INSERT on 'alunos', UPDATE on 'alunos', INSERT on 'credit_transactions'.
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [MUST be called by an authenticated user, as it uses auth.uid().]
*/
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reserva RECORD;
    v_aluno RECORD;
    v_client_profile RECORD;
    v_credit_to_add NUMERIC := 0;
    v_cancellation_policy TEXT;
    v_hours_until_reservation INT;
BEGIN
    -- Etapa 1: Obter detalhes da reserva e bloquear a linha para evitar condições de corrida.
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id FOR UPDATE;

    -- Etapa 2: Validar se o usuário autenticado é o dono da reserva.
    IF v_reserva.profile_id IS NULL OR v_reserva.profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada. Você não pode cancelar esta reserva.';
    END IF;

    -- Etapa 3: Verificar se a reserva já foi cancelada.
    IF v_reserva.status = 'cancelada' THEN
        RAISE EXCEPTION 'Esta reserva já foi cancelada.';
    END IF;

    -- Etapa 4: Calcular as horas restantes até o início da reserva.
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

    -- Etapa 5: Determinar o valor do crédito com base na política de cancelamento.
    IF v_hours_until_reservation >= 24 THEN
        v_credit_to_add := v_reserva.total_price;
        v_cancellation_policy := 'Cancelamento com +24h';
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_to_add := v_reserva.total_price * 0.5;
        v_cancellation_policy := 'Cancelamento entre 12h e 24h';
    ELSE
        v_credit_to_add := 0;
        v_cancellation_policy := 'Cancelamento com <12h';
    END IF;

    -- Etapa 6: Se houver crédito a ser adicionado, garantir que o perfil de aluno exista.
    IF v_credit_to_add > 0 THEN
        -- Tenta encontrar o perfil de 'aluno' correspondente.
        SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id LIMIT 1;

        -- Se o perfil de 'aluno' não existir, cria um.
        IF v_aluno IS NULL THEN
            -- Busca o nome e telefone do cliente na tabela de perfis como fallback.
            SELECT name, phone INTO v_client_profile FROM public.profiles WHERE id = v_reserva.profile_id;
            
            INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, plan_name, join_date)
            VALUES (
                v_reserva.profile_id, 
                v_reserva.arena_id, 
                COALESCE(v_reserva.clientName, v_client_profile.name), 
                COALESCE(v_reserva.clientPhone, v_client_profile.phone), 
                'ativo', 
                'Avulso', 
                CURRENT_DATE
            )
            RETURNING * INTO v_aluno;
        END IF;

        -- Etapa 7: Com o perfil de aluno garantido, atualiza o saldo e registra a transação.
        UPDATE public.alunos
        SET credit_balance = credit_balance + v_credit_to_add
        WHERE id = v_aluno.id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', v_cancellation_policy, p_reserva_id);
    END IF;

    -- Etapa 8: Atualizar o status da reserva para 'cancelada'.
    UPDATE public.reservas
    SET status = 'cancelada'
    WHERE id = p_reserva_id;

END;
$$;

-- Concede permissão de execução para usuários autenticados.
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
