-- 1. Drop the existing trigger and function to ensure a clean slate.
-- The trigger depends on the function, so we drop it first.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 2. Recreate the function with the corrected logic (using 'is_enabled').
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  settings public.gamification_settings;
  points_to_add INT;
  v_aluno_id uuid;
BEGIN
  -- Get gamification settings for the arena
  SELECT * INTO settings
  FROM public.gamification_settings
  WHERE arena_id = NEW.arena_id;

  -- Exit if gamification is not enabled for the arena
  IF settings IS NULL OR NOT settings.is_enabled THEN
    RETURN NEW;
  END IF;

  -- Find the corresponding 'aluno' ID from the 'profile_id'
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

  -- Exit if there is no 'aluno' profile to add points to
  IF v_aluno_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate points to be added
  points_to_add := settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * settings.points_per_real);

  -- Add points to the aluno profile and log the transaction if points are positive
  IF points_to_add > 0 THEN
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
    WHERE id = v_aluno_id;
    
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, related_reservation_id)
    VALUES (NEW.arena_id, v_aluno_id, points_to_add, 'reservation_completed', 'Pontos por reserva #' || substring(NEW.id::text, 1, 8), NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger with the correct syntax.
-- This trigger calls the function above whenever a reservation status is updated to 'realizada'.
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
