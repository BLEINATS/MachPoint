-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct column name
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add INT;
BEGIN
    -- Get gamification settings for the arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id
    LIMIT 1;

    -- Exit if gamification is disabled or no settings found
    IF settings IS NULL OR NOT settings.is_enabled THEN -- Corrected from is_active to is_enabled
        RETURN NEW;
    END IF;

    -- Find the 'aluno' profile associated with the reservation's profile_id
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
    LIMIT 1;

    -- Exit if no 'aluno' profile is found
    IF aluno_profile IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate points
    points_to_add := settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * settings.points_per_real);

    -- Add points to the aluno profile
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
    WHERE id = aluno_profile.id;

    -- Insert into transaction history
    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
    VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Pontos por reserva #' || substr(NEW.id::text, 1, 8), NEW.id);

    RETURN NEW;
END;
$$;

-- Recreate the trigger to call the new function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
