-- Drop the existing trigger to remove the dependency on the faulty function
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct field name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  settings public.gamification_settings;
  points_to_add INT;
  aluno_record public.alunos;
BEGIN
  -- Find the specific arena's gamification settings
  SELECT * INTO settings
  FROM public.gamification_settings
  WHERE arena_id = NEW.arena_id
  LIMIT 1;

  -- Exit if gamification is disabled ('is_enabled' is the correct column name)
  IF settings IS NULL OR NOT settings.is_enabled THEN
    RETURN NEW;
  END IF;

  -- Find the corresponding aluno profile
  SELECT * INTO aluno_record
  FROM public.alunos
  WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
  LIMIT 1;

  -- Exit if no aluno profile is found
  IF aluno_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate points
  points_to_add := settings.points_per_reservation + (NEW.total_price * settings.points_per_real);

  -- Add points and log the transaction if points are greater than 0
  IF points_to_add > 0 THEN
    -- Use the dedicated function to add points, which also handles level ups
    PERFORM public.add_gamification_points(
      p_aluno_id := aluno_record.id,
      p_points_to_add := points_to_add,
      p_description := 'Conclusão da reserva #' || substr(NEW.id::text, 1, 8)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the correct function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
