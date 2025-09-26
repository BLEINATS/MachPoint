-- Drop the trigger first to allow function replacement
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the old functions to be safe
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text);
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function for manual point adjustment
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_arena_id uuid;
BEGIN
  SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;
  IF v_arena_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado para a arena.';
  END IF;

  UPDATE public.alunos
  SET gamification_points = COALESCE(gamification_points, 0) + p_points_to_add
  WHERE id = p_aluno_id;

  INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description)
  VALUES (v_arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$function$;

-- Recreate the function for automatic points on reservation completion
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_settings public.gamification_settings;
  v_points_to_add integer;
  v_aluno_id uuid;
BEGIN
  IF NEW.status <> 'realizada' OR OLD.status = 'realizada' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

  IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
    RETURN NEW;
  END IF;

  IF NEW.profile_id IS NOT NULL THEN
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
  END IF;

  IF v_aluno_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_points_to_add := v_settings.points_per_reservation + (NEW.total_price * v_settings.points_per_real);

  UPDATE public.alunos
  SET gamification_points = COALESCE(gamification_points, 0) + v_points_to_add
  WHERE id = v_aluno_id;

  INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
  VALUES (NEW.arena_id, v_aluno_id, v_points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_reservation_completed_add_points
  AFTER UPDATE ON public.reservas
  FOR EACH ROW
  WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
  EXECUTE FUNCTION public.handle_reservation_completion();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_reservation_completion() TO authenticated;
