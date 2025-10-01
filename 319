-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  settings public.gamification_settings;
  points_to_add INT;
  aluno_profile public.alunos;
BEGIN
  -- Find the settings for the specific arena
  SELECT * INTO settings
  FROM public.gamification_settings
  WHERE arena_id = NEW.arena_id;

  -- If gamification is not enabled or no settings found, exit
  IF NOT FOUND OR NOT settings.is_enabled THEN
    RETURN NEW;
  END IF;

  -- Find the corresponding 'aluno' profile from the 'profile_id' in the reservation
  SELECT * INTO aluno_profile
  FROM public.alunos
  WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
  
  -- If no aluno profile is found, exit
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate points
  points_to_add := settings.points_per_reservation + (NEW.total_price * settings.points_per_real);

  -- If there are points to add, update the aluno's balance and log the transaction
  IF points_to_add > 0 THEN
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
    WHERE id = aluno_profile.id;

    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
    VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
