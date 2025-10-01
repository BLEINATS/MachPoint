/*
  # [Fix] Corrige a função `create_client_reservation_atomic`
  [This operation corrects the `create_client_reservation_atomic` function by changing a column reference from `is_active` to `is_enabled` in the `gamification_settings` table. This fixes a bug that prevented client reservations from being created when gamification was active.]

  ## Query Description: [This operation will replace an existing database function. It is a non-destructive change that only affects the internal logic for creating new reservations. No existing data will be modified or lost. The fix is considered safe and is reversible by reapplying the previous version of the function.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Functions:
    - `public.create_client_reservation_atomic`
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [Authenticated user]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None. The change is a simple column name fix.]
*/
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno_id uuid;
  v_profile_id uuid := auth.uid();
  v_reserva_id uuid;
  gamification_is_active boolean;
  points_for_reservation int;
  points_for_value int;
  total_points_to_add int;
BEGIN
  -- 1. Garante que o perfil de aluno existe para o usuário atual na arena.
  PERFORM public.ensure_aluno_profile(p_arena_id, v_profile_id, p_client_name, p_client_phone);

  -- 2. Obtém o ID do aluno.
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

  -- Se não encontrar, lança um erro.
  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao encontrar ou criar o perfil de aluno para o usuário % na arena %', v_profile_id, p_arena_id;
  END IF;

  -- 3. Debita o crédito, se houver.
  IF p_credit_to_use > 0 THEN
    -- Debita o crédito do saldo do aluno
    UPDATE public.alunos
    SET credit_balance = credit_balance - p_credit_to_use
    WHERE id = v_aluno_id;

    -- Registra a transação de crédito
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento de reserva');
  END IF;

  -- 4. Insere a nova reserva
  INSERT INTO public.reservas (
    arena_id,
    quadra_id,
    profile_id,
    aluno_id,
    date,
    start_time,
    end_time,
    total_price,
    payment_status,
    sport_type,
    credit_used,
    rented_items,
    clientName,
    clientPhone,
    created_by_name,
    type,
    status
  ) VALUES (
    p_arena_id,
    p_quadra_id,
    v_profile_id,
    v_aluno_id,
    p_date,
    p_start_time,
    p_end_time,
    p_total_price,
    p_payment_status,
    p_sport_type,
    p_credit_to_use,
    p_rented_items,
    p_client_name,
    p_client_phone,
    p_client_name, -- Para reservas de cliente, o criador é o próprio cliente
    'avulsa',
    'confirmada'
  ) RETURNING id INTO v_reserva_id;

  -- 5. Lógica de Gamificação
  -- CORREÇÃO: Usa 'is_enabled' em vez de 'is_active'
  SELECT is_enabled INTO gamification_is_active
  FROM public.gamification_settings
  WHERE arena_id = p_arena_id;

  IF gamification_is_active THEN
    SELECT points_per_reservation, points_per_real
    INTO points_for_reservation, points_for_value
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    total_points_to_add := (points_for_reservation) + (floor(p_total_price) * points_for_value);

    IF total_points_to_add > 0 THEN
      PERFORM public.add_gamification_points(
        v_aluno_id,
        total_points_to_add,
        'Pontos por nova reserva'
      );
    END IF;
  END IF;

  -- 6. Retorna o ID da reserva criada
  RETURN v_reserva_id;
END;
$$;
