/*
  # [Fix] Corrigir nome da coluna na função de criação de reserva

  ## Query Description:
  Esta operação corrige a função `create_client_reservation_atomic` que estava tentando inserir dados em uma coluna inexistente (`aluno_id`) na tabela `reservas`. A função foi atualizada para usar a coluna correta, `profile_id`, que armazena a referência ao perfil do usuário que fez a reserva. Isso resolve o erro que impedia os clientes de criarem novas reservas.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true (revertendo para a versão anterior da função)

  ## Structure Details:
  - Modifies function: `public.create_client_reservation_atomic`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: User must be authenticated.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low. Function execution time is not significantly affected.
*/

-- Remove a função existente para evitar conflitos de assinatura.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,"time", "time",numeric,public.payment_status_enum,"text",numeric,jsonb,"text","text");

-- Recria a função com a lógica e nomes de coluna corretos.
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (
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
RETURNS void AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
  v_reserva_id uuid;
  v_gamification_is_enabled boolean;
  v_points_per_real integer;
  v_points_per_reservation integer;
BEGIN
  -- Garante que o perfil de aluno exista para o usuário nesta arena
  v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id, p_client_name, p_client_phone);

  -- Verifica se já existe uma reserva conflitante
  IF public.check_duplicate_reservation(p_quadra_id, p_date, p_start_time::time, p_end_time::time) THEN
    RAISE EXCEPTION 'Horário indisponível. Já existe uma reserva neste período.';
  END IF;

  -- Insere a nova reserva
  INSERT INTO public.reservas (
    arena_id,
    quadra_id,
    profile_id, -- Coluna corrigida
    clientName,
    clientPhone,
    date,
    start_time,
    end_time,
    status,
    type,
    total_price,
    credit_used,
    payment_status,
    sport_type,
    rented_items,
    created_by_name
  ) VALUES (
    p_arena_id,
    p_quadra_id,
    v_profile_id, -- Usando a variável com o ID do perfil
    p_client_name,
    p_client_phone,
    p_date,
    p_start_time,
    p_end_time,
    'confirmada',
    'avulsa',
    p_total_price,
    p_credit_to_use,
    p_payment_status,
    p_sport_type,
    p_rented_items,
    p_client_name
  ) RETURNING id INTO v_reserva_id;

  -- Deduz o crédito, se houver
  IF p_credit_to_use > 0 THEN
    PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
  END IF;

  -- Adiciona pontos de gamificação se o sistema estiver ativo
  SELECT is_enabled, points_per_real, points_per_reservation
  INTO v_gamification_is_enabled, v_points_per_real, v_points_per_reservation
  FROM public.gamification_settings
  WHERE arena_id = p_arena_id;

  IF v_gamification_is_enabled THEN
    DECLARE
      v_points_to_add integer := 0;
    BEGIN
      v_points_to_add := v_points_to_add + v_points_per_reservation;
      v_points_to_add := v_points_to_add + floor(p_total_price * v_points_per_real);

      IF v_points_to_add > 0 THEN
        PERFORM public.add_gamification_points(
          v_aluno_id,
          v_points_to_add,
          'Reserva criada',
          'reservation_creation',
          p_arena_id,
          v_reserva_id
        );
      END IF;
    END;
  END IF;

END;
$$ LANGUAGE plpgsql;
