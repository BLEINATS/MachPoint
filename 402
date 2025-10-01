/*
          # [SECURITY] Fix Function Search Path
          [This operation enhances security by explicitly setting the 'search_path' for database functions, preventing potential unauthorized schema manipulations.]

          ## Query Description: [This operation will alter existing database functions to set a fixed search_path. This is a safe, non-destructive change that improves security by ensuring functions operate only within the intended 'public' schema.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [
            - public.add_gamification_points(uuid, integer, text)
            - public.create_my_aluno_profile()
          ]
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_arena_id UUID;
    v_profile_id UUID;
    v_transaction_type gamification_point_transaction_type;
BEGIN
    -- Obter arena_id e profile_id do aluno
    SELECT arena_id, profile_id INTO v_arena_id, v_profile_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Determinar o tipo de transação
    IF p_description LIKE 'Resgate:%' THEN
        v_transaction_type := 'reward_redemption';
    ELSIF p_description LIKE 'Conquista:%' THEN
        v_transaction_type := 'achievement_unlocked';
    ELSIF p_description LIKE 'Reserva realizada%' THEN
        v_transaction_type := 'reservation_completed';
    ELSE
        v_transaction_type := 'manual_adjustment';
    END IF;

    -- Inserir a transação de pontos
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_transaction_type, p_description);

END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_my_aluno_profile()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_profile_id UUID;
    v_arena_id UUID;
    v_aluno_id UUID;
    v_user_email TEXT;
    v_user_phone TEXT;
    v_user_name TEXT;
BEGIN
    -- 1. Get current user's info
    SELECT id, email, raw_user_meta_data->>'name', raw_user_meta_data->>'phone'
    INTO v_profile_id, v_user_email, v_user_name, v_user_phone
    FROM auth.users
    WHERE id = auth.uid();

    -- 2. Find the arena where the user is a member but NOT yet an aluno
    SELECT m.arena_id INTO v_arena_id
    FROM arena_memberships m
    LEFT JOIN alunos a ON m.arena_id = a.arena_id AND m.profile_id = a.profile_id
    WHERE m.profile_id = v_profile_id AND a.id IS NULL
    LIMIT 1;

    -- 3. If such an arena is found, create the aluno profile
    IF v_arena_id IS NOT NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
        VALUES (
            v_arena_id,
            v_profile_id,
            v_user_name,
            v_user_email,
            v_user_phone,
            'ativo',
            'Avulso',
            CURRENT_DATE
        )
        RETURNING id INTO v_aluno_id;

        RETURN v_aluno_id;
    END IF;

    -- 4. If no such arena is found, return NULL
    RETURN NULL;
END;
$function$
;
