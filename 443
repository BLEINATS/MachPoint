/*
          # [Operation Name]
          Secure `add_gamification_points` Function

          ## Query Description: [This operation secures the `add_gamification_points` function by explicitly setting the `search_path`. This is a preventative security measure to ensure the function operates in the expected schema context, mitigating potential risks associated with mutable search paths. It does not alter the function's logic or impact existing data.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function `add_gamification_points` will be dropped and recreated with a security definer.
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. This is a definition change with no impact on query performance.
          */

DROP FUNCTION IF EXISTS public.add_gamification_points(uuid,integer,text,gamification_point_transaction_type,uuid,uuid);

CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text,
    p_transaction_type gamification_point_transaction_type DEFAULT 'manual_adjustment'::gamification_point_transaction_type,
    p_related_reservation_id uuid DEFAULT NULL::uuid,
    p_related_achievement_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_arena_id UUID;
    v_total_points INT;
    v_current_level_id UUID;
    v_new_level_id UUID;
BEGIN
    -- Get the arena_id from the aluno's profile
    SELECT arena_id INTO v_arena_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Insert the transaction
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, related_reservation_id, related_achievement_id)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, p_transaction_type, p_description, p_related_reservation_id, p_related_achievement_id);

    -- Update the total points on the alunos table
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + p_points_to_add
    WHERE id = p_aluno_id
    RETURNING gamification_points, gamification_level_id INTO v_total_points, v_current_level_id;

    -- Determine the new level
    SELECT id INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = v_arena_id
    AND points_required &lt;= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the level if it has changed
    IF v_new_level_id IS NOT NULL AND v_new_level_id &lt;> v_current_level_id THEN
        UPDATE public.alunos
        SET gamification_level_id = v_new_level_id
        WHERE id = p_aluno_id;
    END IF;
END;
$function$
;
