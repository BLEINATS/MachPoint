/*
          # [Operation Name]
          Security Hardening: add_gamification_points

          ## Query Description: [This operation redefines the 'add_gamification_points' function to enhance security by setting a fixed search_path. This is a preventative measure against potential security vulnerabilities and does not alter the function's behavior or impact existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.add_gamification_points(uuid, integer, text)
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_arena_id UUID;
    v_profile_id UUID;
    v_transaction_type gamification_point_transaction_type;
BEGIN
    -- Get arena_id and profile_id from the aluno
    SELECT arena_id, profile_id INTO v_arena_id, v_profile_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Determine transaction type based on description
    IF p_description ILIKE 'Resgate:%' THEN
        v_transaction_type := 'reward_redemption';
    ELSIF p_description ILIKE 'Conquista:%' THEN
        v_transaction_type := 'achievement_unlocked';
    ELSIF p_description ILIKE 'Reserva concluída%' THEN
        v_transaction_type := 'reservation_completed';
    ELSE
        v_transaction_type := 'manual_adjustment';
    END IF;

    -- Insert into transaction history
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_transaction_type, p_description);

END;
$function$
;
