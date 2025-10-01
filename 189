/*
  # [Definitive Fix] Cleanup and Recreate Client Reservation Function
  [This operation cleans up conflicting versions of the client reservation function and recreates the single, correct version to resolve the "could not choose best candidate" error.]

  ## Query Description: [This script will drop any existing functions named `create_client_reservation_atomic` with different parameter signatures. It then creates the definitive version of the function, ensuring that time parameters are correctly typed as `time` and text parameters as `text`. This resolves the ambiguity that was preventing clients from creating reservations. This operation is safe and does not affect existing reservation data.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Drops potentially conflicting functions: `public.create_client_reservation_atomic`
  - Creates the definitive function: `public.create_client_reservation_atomic`
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Grants EXECUTE to `authenticated` role]
  
  ## Performance Impact:
  - Indexes: [No]
  - Triggers: [No]
  - Estimated Impact: [None. This is a function definition change.]
*/

-- Drop the version with character varying, if it exists
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
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
);

-- Drop the version with time and text, if it exists
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
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
);

-- Re-create the definitive, correct version of the function
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
RETURNS void AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_id uuid := auth.uid();
    v_new_reserva_id uuid;
    v_gamification_is_enabled boolean;
    v_points_to_add int;
BEGIN
    -- 1. Garante que o perfil de aluno existe para o usuário/arena
    v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id);

    -- 2. Verifica se já existe uma reserva conflitante
    IF EXISTS (
        SELECT 1
        FROM public.reservas r
        WHERE r.quadra_id = p_quadra_id
        AND r.date = p_date
        AND r.status <> 'cancelada'
        AND (r.start_time, r.end_time) OVERLAPS (p_start_time, p_end_time)
    ) THEN
        RAISE EXCEPTION 'Conflito de horário: Já existe uma reserva para esta quadra neste horário.';
    END IF;

    -- 3. Insere a nova reserva
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, total_price, payment_status,
        sport_type, credit_used, rented_items, clientName, clientPhone, type, status, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price, p_payment_status,
        p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone, 'avulsa', 'confirmada', p_client_name
    )
    RETURNING id INTO v_new_reserva_id;

    -- 4. Deduz créditos, se houver
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
        
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8), v_new_reserva_id);
    END IF;

    -- 5. Adiciona pontos de gamificação (se ativado)
    SELECT is_enabled INTO v_gamification_is_enabled
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF v_gamification_is_enabled THEN
        SELECT points_per_reservation INTO v_points_to_add
        FROM public.gamification_settings
        WHERE arena_id = p_arena_id;

        IF v_points_to_add > 0 THEN
            PERFORM public.add_gamification_points(v_aluno_id, v_points_to_add, 'Pontos por nova reserva');
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,date,time without time zone,time without time zone,numeric,public.payment_status_enum,text,numeric,jsonb,text,text) TO authenticated;
