/*
  # [Critical Fix] Corrige a função de criação de reserva do cliente
  [Este script corrige um erro crítico que impedia os clientes de criarem novas reservas. O problema era uma chamada incorreta a uma função interna de verificação de duplicidade.]

  ## Query Description: [Esta operação substitui a função `create_client_reservation_atomic` por uma versão corrigida. A nova versão garante que a verificação de conflitos de horário seja feita com os parâmetros corretos, resolvendo o erro "function does not exist" que bloqueava a criação de reservas. A operação é segura e não afeta dados existentes.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Function `public.create_client_reservation_atomic` será substituída.
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [authenticated]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [Nenhum impacto negativo. A correção deve melhorar a confiabilidade da criação de reservas.]
*/

-- Passo 1: Remover a função antiga e incorreta para evitar conflitos.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time without time zone,time without time zone,numeric,public.payment_status_enum,text,numeric,jsonb,text,text);

-- Passo 2: Recriar a função com a lógica correta.
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_gamification_is_enabled boolean;
    v_points_per_reservation int;
BEGIN
    -- Garante que o cliente tenha um perfil de 'aluno' para esta arena.
    v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    -- Verifica se já existe uma reserva no mesmo horário.
    -- ESTA É A LINHA CORRIGIDA: Adicionado p_quadra_id e o último parâmetro (NULL para reserva nova).
    IF public.check_duplicate_reservation(p_arena_id, p_quadra_id, p_date, p_start_time, p_end_time, NULL) THEN
        RAISE EXCEPTION 'Horário indisponível. Já existe uma reserva para esta quadra neste horário.';
    END IF;

    -- Insere a nova reserva.
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, clientName, clientPhone, date, start_time, end_time, 
        status, type, total_price, credit_used, payment_status, sport_type, rented_items, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time,
        'confirmada', 'avulsa', p_total_price, p_credit_to_use, p_payment_status, p_sport_type, p_rented_items, p_client_name
    );

    -- Lógica de Gamificação
    SELECT is_enabled, points_per_reservation 
    INTO v_gamification_is_enabled, v_points_per_reservation
    FROM public.gamification_settings 
    WHERE arena_id = p_arena_id;

    IF v_gamification_is_enabled AND v_points_per_reservation > 0 THEN
        PERFORM public.add_gamification_points(
            v_aluno_id,
            v_points_per_reservation,
            'Pontos por nova reserva',
            'reservation_completed',
            p_arena_id
        );
    END IF;

END;
$$;
