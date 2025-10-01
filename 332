-- This script fixes a typo in the handle_reservation_completion function
-- and safely recreates the associated trigger.
-- Step 1: Drop the existing trigger to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
-- Step 2: Recreate the function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion() RETURNS TRIGGER AS $$
DECLARE
  settings public.gamification_settings;
  points_to_add INT;
  aluno_profile public.alunos;
BEGIN
  -- Get gamification settings for the arena
  SELECT
    * INTO settings
  FROM
    public.gamification_settings
  WHERE
    arena_id = NEW.arena_id;
  -- If gamification is not enabled or no settings found, exit
  -- CORRECTED: from is_active to is_enabled
  IF NOT FOUND
  OR NOT settings.is_enabled THEN
    RETURN NEW;
  END IF;
  -- Calculate points to add
  points_to_add := settings.points_per_reservation + (
    floor(NEW.total_price) * settings.points_per_real
  );
  -- Award points if the reservation has a profile linked
  IF points_to_add > 0
  AND NEW.profile_id IS NOT NULL THEN
  UPDATE
    public.alunos
  SET
    gamification_points = COALESCE(gamification_points, 0) + points_to_add
  WHERE
    profile_id = NEW.profile_id
    AND arena_id = NEW.arena_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Step 3: Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas FOR EACH ROW
WHEN (
  NEW.status = 'realizada' AND OLD.status <> 'realizada'
) EXECUTE FUNCTION handle_reservation_completion();
