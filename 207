-- Drop the trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Drop the function to ensure a clean slate
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id UUID;
  v_total_points INT;
  v_level_id UUID;
  v_arena_id UUID;
BEGIN
  -- Determine which aluno_id and arena_id to use based on the operation
  IF (TG_OP = 'DELETE') THEN
    v_aluno_id := OLD.aluno_id;
    v_arena_id := OLD.arena_id;
  ELSE
    v_aluno_id := NEW.aluno_id;
    v_arena_id := NEW.arena_id;
  END IF;

  -- If aluno_id is null, we can't do anything
  IF v_aluno_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate the new total points for the aluno
  SELECT COALESCE(SUM(points), 0)
  INTO v_total_points
  FROM public.gamification_point_transactions
  WHERE aluno_id = v_aluno_id;

  -- Find the corresponding level for the new total points
  SELECT id
  INTO v_level_id
  FROM public.gamification_levels
  WHERE arena_id = v_arena_id
    AND points_required <= v_total_points
  ORDER BY points_required DESC
  LIMIT 1;

  -- Update the alunos table with the new total points and level
  UPDATE public.alunos
  SET
    gamification_points = v_total_points,
    gamification_level_id = v_level_id
  WHERE id = v_aluno_id;

  RETURN NULL; -- The result is ignored since this is an AFTER trigger
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_gamification_points();
