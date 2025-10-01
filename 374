/*
          # [FIX] Define o tipo de status de pagamento e corrige a função de reserva
          Este script corrige um erro crítico que impede a criação de reservas.
          1. Cria o tipo de dado `payment_status_enum` que estava faltando.
          2. Altera a tabela `reservas` para usar este novo tipo na coluna `payment_status`, garantindo a consistência dos dados.
          3. Recria a função `create_client_reservation_atomic` que falhou anteriormente devido à ausência do tipo.

          ## Query Description: "Esta operação irá modificar a estrutura da tabela `reservas` para padronizar os status de pagamento. Recomenda-se um backup antes de aplicar, como em qualquer alteração de esquema. A mudança garante que apenas status de pagamento válidos sejam registrados."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Creates ENUM type: `public.payment_status_enum`
          - Alters table: `public.reservas`, column `payment_status`
          - Recreates function: `public.create_client_reservation_atomic`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: None for this migration
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Baixo. A alteração da tabela pode levar um momento em tabelas muito grandes.
          */

-- Etapa 1: Criar o tipo ENUM se ele não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE public.payment_status_enum AS ENUM ('pago', 'pendente', 'parcialmente_pago');
    END IF;
END$$;

-- Etapa 2: Alterar a coluna na tabela 'reservas' para usar o tipo ENUM
-- Esta operação pode falhar se a coluna 'payment_status' contiver valores que não estão no ENUM.
-- Assumimos que os valores existentes são compatíveis ou nulos.
-- Também adiciona um valor padrão para novas inserções.
ALTER TABLE public.reservas
ALTER COLUMN payment_status TYPE public.payment_status_enum USING payment_status::text::public.payment_status_enum,
ALTER COLUMN payment_status SET DEFAULT 'pendente';

-- Etapa 3: Recriar a função `create_client_reservation_atomic` com a assinatura correta
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
SET search_path = ''
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
  v_reservation_id uuid;
  v_gamification_is_enabled boolean;
BEGIN
  -- 1. Obter aluno_id
  SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id LIMIT 1;
  
  -- 2. Verificar se a gamificação está ativa
  SELECT is_enabled INTO v_gamification_is_enabled FROM public.gamification_settings WHERE arena_id = p_arena_id;

  -- 3. Inserir a reserva
  INSERT INTO public.reservas (arena_id, quadra_id, profile_id, date, start_time, end_time, total_price, payment_status, sport_type, credit_used, rented_items, clientName, clientPhone, created_by_name)
  VALUES (p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price, p_payment_status, p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone, p_client_name)
  RETURNING id INTO v_reservation_id;

  -- 4. Deduzir crédito, se usado
  IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
    PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reservation_id::text, 1, 8), v_reservation_id);
  END IF;

  -- 5. Adicionar pontos de gamificação, se ativa
  IF v_gamification_is_enabled IS TRUE AND v_aluno_id IS NOT NULL THEN
    PERFORM public.add_gamification_points(v_aluno_id, 'reservation_completed', v_reservation_id);
  END IF;
END;
$$;
