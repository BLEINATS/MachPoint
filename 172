/*
  # [Operation Name]
  Correção Definitiva da Função de Reserva de Cliente

  ## Query Description: [Este script resolve um erro de "função não única" que impede a criação de reservas por clientes. Ele remove todas as versões conflitantes e antigas da função `create_client_reservation_atomic` e recria a versão correta e mais recente. Esta operação é segura e não afeta dados existentes, apenas a lógica interna do banco de dados.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Medium"]
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Remove múltiplas assinaturas da função `create_client_reservation_atomic`.
  - Recria a função `create_client_reservation_atomic` com a assinatura correta e lógica atualizada.
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [authenticated]
  
  ## Performance Impact:
  - Indexes: [No]
  - Triggers: [No]
  - Estimated Impact: [Baixo. Apenas afeta a criação de novas reservas, corrigindo o erro.]
*/

-- Remove todas as assinaturas conflitantes conhecidas.
-- Adicionamos várias assinaturas para garantir que todas as versões antigas sejam removidas.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,text,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying, uuid);

-- Recria a função com a lógica correta e segura
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time character varying,
    p_end_time character varying,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type character varying,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name character varying,
    p_client_phone character varying
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_aluno_id uuid;
    v_new_reserva_id uuid;
    v_gamification_settings record;
    v_points_to_add int := 0;
BEGIN
    -- Garante que o cliente exista como um perfil de aluno na arena
    v_aluno_id := public.ensure_aluno_profile(auth.uid(), p_arena_id, p_client_name, p_client_phone);
    
    -- Obtém o profile_id associado ao registro do aluno
    SELECT profile_id INTO v_profile_id FROM public.alunos WHERE id = v_aluno_id;

    -- Verifica se há conflitos de horário
    IF EXISTS (
        SELECT 1
        FROM public.reservas r
        WHERE r.quadra_id = p_quadra_id
          AND r.date = p_date
          AND r.status <> 'cancelada'
          AND (
              (p_start_time::time, p_end_time::time) OVERLAPS (r.start_time, r.end_time)
          )
    ) THEN
        RAISE EXCEPTION 'Conflito de horário. Já existe uma reserva neste horário.';
    END IF;

    -- Insere a nova reserva
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, clientName, clientPhone, date, start_time, end_time,
        total_price, payment_status, sport_type, credit_used, rented_items, type, status,
        created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time,
        p_total_price, p_payment_status, p_sport_type, p_credit_to_use, p_rented_items, 'avulsa', 'confirmada',
        p_client_name
    )
    RETURNING id INTO v_new_reserva_id;

    -- Deduz o crédito, se utilizado
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    END IF;

    -- Adiciona pontos de gamificação, se o sistema estiver ativo
    SELECT is_enabled, points_per_reservation, points_per_real INTO v_gamification_settings
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF v_gamification_settings.is_enabled THEN
        v_points_to_add := v_gamification_settings.points_per_reservation + floor(p_total_price * v_gamification_settings.points_per_real);
        
        IF v_points_to_add > 0 THEN
            -- A função add_gamification_points já cria a transação
            PERFORM public.add_gamification_points(v_aluno_id, v_points_to_add, 'Reserva #' || v_new_reserva_id::text);
        END IF;
    END IF;

    RETURN v_new_reserva_id;
END;
$$;
