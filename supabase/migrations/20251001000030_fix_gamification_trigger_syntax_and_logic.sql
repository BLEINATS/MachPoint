-- Drop the trigger first, as it depends on the function
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct logic and field names
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings public.gamification_settings;
  aluno_profile public.alunos;
  points_to_add INT;
BEGIN
  -- Fetch gamification settings for the arena
  SELECT *
  INTO settings
  FROM public.gamification_settings
  WHERE arena_id = NEW.arena_id
  LIMIT 1;

  -- Proceed only if gamification is enabled (using the correct column name 'is_enabled')
  IF FOUND AND settings.is_enabled THEN
    -- Find the corresponding 'aluno' profile
    SELECT *
    INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
    LIMIT 1;

    -- Proceed only if an 'aluno' profile is found
    IF FOUND THEN
      -- Calculate points
      points_to_add := settings.points_per_reservation + floor(NEW.total_price * settings.points_per_real);

      -- Update aluno's points
      UPDATE public.alunos
      SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
      WHERE id = aluno_profile.id;

      -- Log the transaction
      INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
      VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Pontos por reserva #' || substr(NEW.id::text, 1, 8), NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger with the correct syntax (no semicolon in WHEN clause)
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();

-- Grant execute on the function for the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_reservation_completion() TO authenticated;
