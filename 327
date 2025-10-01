-- This migration fixes the function responsible for adding gamification points.
-- It now correctly handles cases where the current points balance is NULL, preventing silent failures.
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_arena_id uuid;
BEGIN
    -- Get the arena_id from the aluno record
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    -- Update the points balance, using COALESCE to handle NULL values safely
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + p_points_to_add
    WHERE id = p_aluno_id;

    -- Insert into transaction history
    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$$;
