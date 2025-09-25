/*
# [Fix] Resolução de Conflito de Função de Reserva
[Este script remove funções duplicadas `create_client_reservation_atomic` e recria uma versão única e correta para evitar ambiguidades na API.]

## Query Description: [Esta operação irá remover as versões conflitantes da função de criação de reserva e substituí-las por uma única versão definitiva. Não há risco de perda de dados de reservas existentes, mas é uma alteração estrutural no banco de dados.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- DROP FUNCTION public.create_client_reservation_atomic (duas vezes, com assinaturas diferentes)
- CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (versão definitiva)

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Nenhum impacto de performance esperado. A correção resolve um erro de execução.]
*/

-- Drop the function with the 'text' parameter type to resolve ambiguity
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status text, -- The conflicting type
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
);

-- Drop the function with the 'public.payment_status' parameter type as well, to be safe and ensure a clean slate
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status public.payment_status, -- The correct type
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
);


-- Recreate the function with the correct, unambiguous signature
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status public.payment_status,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS void AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    new_reserva_id uuid;
BEGIN
    -- Ensure the client has an 'aluno' profile for this arena
    v_aluno_id := public.ensure_aluno_profile_exists(p_arena_id, v_profile_id, p_client_name, p_client_phone);

    -- Insert the reservation and get the new ID
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time,
        total_price, payment_status, sport_type, credit_used, rented_items,
        clientName, clientPhone, type, status
    ) VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time,
        p_total_price, p_payment_status, p_sport_type, p_credit_to_use, p_rented_items,
        p_client_name, p_client_phone, 'avulsa', 'confirmada'
    ) RETURNING id INTO new_reserva_id;

    -- If credit was used, update the aluno's balance and log the transaction
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento de reserva', new_reserva_id);
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search_path to an empty string to prevent potential security issues.
ALTER FUNCTION public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status, text, numeric, jsonb, text, text) SET search_path = '';
