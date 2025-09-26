-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the CORRECT column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add INT;
BEGIN
    -- 1. Get the gamification settings for the arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- 2. Check if the system is active for this arena
    IF settings IS NULL OR NOT settings.is_enabled THEN -- Using the correct 'is_enabled'
        RETURN NEW;
    END IF;

    -- 3. Find the corresponding 'aluno' profile
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no 'aluno' profile, nothing to do
    IF aluno_profile IS NULL THEN
        RETURN NEW;
    END IF;

    -- 4. Calculate points
    points_to_add := settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * settings.points_per_real);

    -- 5. Add points if they are greater than 0
    IF points_to_add > 0 THEN
        PERFORM public.add_gamification_points(
            aluno_profile.id,
            points_to_add,
            'Pontos por reserva #' || substr(NEW.id::text, 1, 8)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
