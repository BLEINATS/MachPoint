/*
# [Function Fix] Corrige Nomes de Coluna na Criação de Reserva

[Este script corrige um erro de digitação nos nomes das colunas `client_name` e `client_phone` dentro da função de banco de dados `create_client_reservation_atomic`. O erro impedia que novas reservas de clientes fossem salvas corretamente.]

## Query Description: [Esta operação é segura e não afeta dados existentes. Ela substitui uma função de banco de dados com uma versão corrigida para garantir que futuras reservas sejam criadas com sucesso. Nenhum backup é necessário.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Functions being affected:
  - `public.create_client_reservation_atomic` (DROP and CREATE)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [No]
- Triggers: [No]
- Estimated Impact: [Nenhum impacto de performance esperado.]
*/

-- Drop a função antiga para evitar conflitos
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status, text, numeric, jsonb, text, text);

-- Recria a função com os nomes de coluna corretos
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_aluno_id uuid;
  v_reserva_id uuid;
BEGIN
  -- 1. Get the profile_id of the current user
  v_profile_id := auth.uid();

  -- 2. Ensure an aluno profile exists for this user in this arena
  v_aluno_id := public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);

  -- 3. Insert the reservation with corrected column names
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
    client_name, -- FIX: Changed to snake_case
    client_phone, -- FIX: Changed to snake_case
    type,
    status
  )
  VALUES (
    p_arena_id,
    p_quadra_id,
    v_profile_id,
    v_aluno_id,
    p_date,
    p_start_time,
    p_end_time,
    p_total_price,
    p_payment_status::public.payment_status,
    p_sport_type,
    p_credit_to_use,
    p_rented_items,
    p_client_name,
    p_client_phone,
    'avulsa',
    'confirmada'
  )
  RETURNING id INTO v_reserva_id;

  -- 4. Deduct credit if used
  IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
    -- Logic to deduct credit from aluno profile
    UPDATE public.alunos
    SET credit_balance = credit_balance - p_credit_to_use
    WHERE id = v_aluno_id;

    -- Log the credit transaction
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || v_reserva_id::text, v_reserva_id);
  END IF;

  RETURN v_reserva_id;
END;
$$;
