-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct field name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add INT;
BEGIN
    -- Fetch settings for the arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- Check if gamification is enabled using the correct column 'is_enabled'
    IF settings IS NULL OR NOT settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Find the corresponding student profile
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    IF aluno_profile IS NULL THEN
        RETURN NEW; -- No student profile to add points to
    END IF;

    -- Calculate points based on settings
    points_to_add := 0;
    IF settings.points_per_reservation > 0 THEN
        points_to_add := points_to_add + settings.points_per_reservation;
    END IF;
    IF settings.points_per_real > 0 AND NEW.total_price > 0 THEN
        points_to_add := points_to_add + floor(NEW.total_price * settings.points_per_real);
    END IF;

    IF points_to_add > 0 THEN
        -- Add points to the student
        UPDATE public.alunos
        SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
        WHERE id = aluno_profile.id;

        -- Insert into transaction history
        INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
        VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Reserva concluída', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
