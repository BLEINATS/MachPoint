-- 1. Drop the existing trigger and function to ensure a clean slate.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 2. Recreate the function with the correct column name 'is_enabled'.
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  settings public.gamification_settings;
  aluno_profile public.alunos;
  points_to_add INT;
BEGIN
  -- Fetch the gamification settings for the specific arena
  SELECT * INTO settings
  FROM public.gamification_settings
  WHERE arena_id = NEW.arena_id
  LIMIT 1;

  -- Only proceed if gamification is enabled for the arena
  IF FOUND AND settings.is_enabled THEN
    -- Find the corresponding 'aluno' profile
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
    LIMIT 1;

    -- If an aluno profile exists, calculate and add points
    IF FOUND THEN
      points_to_add := settings.points_per_reservation + (NEW.total_price * settings.points_per_real);

      IF points_to_add > 0 THEN
        -- Use the dedicated function to add points and record the transaction
        PERFORM public.add_gamification_points(
          p_aluno_id := aluno_profile.id,
          p_points_to_add := points_to_add,
          p_description := 'Conclusão da reserva #' || substr(NEW.id::text, 1, 8),
          p_type := 'reservation_completed',
          p_related_reservation_id := NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger with the corrected syntax (no semicolon in the WHEN clause).
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
