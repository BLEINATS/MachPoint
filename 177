/*
# [SECURITY] Set search_path for core functions

## Query Description: [This operation improves security by explicitly setting the search_path for several core database functions. This prevents potential hijacking attacks by ensuring functions only search for tables and other objects within the 'public' schema, reducing the risk of malicious code execution. This is a non-destructive, safe change.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions being altered:
  - public.ensure_aluno_profile(uuid, uuid)
  - public.add_gamification_points(uuid, integer, text)
  - public.handle_client_cancellation_final(uuid)

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [Not Changed]

## Performance Impact:
- Indexes: [Not Changed]
- Triggers: [Not Changed]
- Estimated Impact: [None]
*/

-- Drop and recreate ensure_aluno_profile
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS TABLE(id uuid, arena_id uuid, profile_id uuid, name text, email text, phone text, status text, sport text, plan_name text, monthly_fee numeric, join_date date, created_at timestamptz, avatar_url text, credit_balance numeric, gamification_points integer, gamification_level_id uuid) AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    SET search_path = 'public';
    -- Check if an aluno profile already exists
    SELECT a.id INTO v_aluno_id FROM public.alunos a WHERE a.profile_id = p_profile_id AND a.arena_id = p_arena_id;

    -- If not, create one from the public.profiles table
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
        SELECT p_arena_id, p.id, p.name, p.email, p.phone, 'ativo', 'Avulso', CURRENT_DATE
        FROM public.profiles p
        WHERE p.id = p_profile_id
        RETURNING public.alunos.id INTO v_aluno_id;
    END IF;

    -- Return the aluno profile
    RETURN QUERY
    SELECT
        a.id,
        a.arena_id,
        a.profile_id,
        a.name,
        a.email,
        a.phone,
        a.status::text,
        a.sport,
        a.plan_name,
        a.monthly_fee,
        a.join_date,
        a.created_at,
        a.avatar_url,
        a.credit_balance,
        (SELECT COALESCE(SUM(points), 0) FROM public.gamification_point_transactions WHERE aluno_id = a.id)::integer as gamification_points,
        a.gamification_level_id
    FROM public.alunos a
    WHERE a.id = v_aluno_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate add_gamification_points
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text);
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void AS $$
BEGIN
    SET search_path = 'public';
    INSERT INTO gamification_point_transactions (aluno_id, arena_id, points, type, description)
    SELECT p_aluno_id, a.arena_id, p_points_to_add, 'manual_adjustment', p_description
    FROM alunos a
    WHERE a.id = p_aluno_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate handle_client_cancellation_final
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void AS $$
DECLARE
    v_reserva public.reservas;
    v_arena public.arenas;
    v_aluno public.alunos;
    v_credit_amount numeric;
    v_policy_reason text;
    v_hours_until_reservation integer;
BEGIN
    SET search_path = 'public';
    -- Get reservation and arena details
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;
    SELECT * INTO v_arena FROM public.arenas WHERE id = v_reserva.arena_id;

    -- Ensure the user cancelling is the one who made the reservation
    IF v_reserva.profile_id IS NULL OR v_reserva.profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: Você não pode cancelar esta reserva.';
    END IF;

    -- Find the corresponding aluno profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;
    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Perfil de aluno não encontrado para esta reserva.';
    END IF;

    -- Calculate hours until reservation
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

    -- Determine credit based on policy
    IF v_hours_until_reservation >= 24 THEN
        v_credit_amount := v_reserva.total_price;
        v_policy_reason := 'Cancelamento com +24h';
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_amount := v_reserva.total_price * 0.5;
        v_policy_reason := 'Cancelamento entre 12h e 24h';
    ELSE
        v_credit_amount := 0;
        v_policy_reason := 'Cancelamento com -12h';
    END IF;

    -- Update reservation status
    UPDATE public.reservas
    SET status = 'cancelada'
    WHERE id = p_reserva_id;

    -- Add credit if applicable
    IF v_credit_amount > 0 THEN
        -- Use the add_credit_to_aluno RPC to handle the update atomically
        PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_amount);

        -- Log the credit transaction
        INSERT INTO public.credit_transactions(aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', 'Crédito (' || v_policy_reason || ') da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
