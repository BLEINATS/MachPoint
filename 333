-- 1. Drop the existing trigger to allow function replacement.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- 2. Drop the faulty function.
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 3. Recreate the function with the correct field name ('is_enabled' instead of 'is_active').
/*
# [Function] handle_reservation_completion
This function is triggered when a reservation status is updated to 'realizada'.
It awards gamification points to the client based on the arena's settings.
*/
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add INT;
BEGIN
    -- Find the gamification settings for the specific arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- If gamification is not enabled or no settings found, exit
    IF NOT FOUND OR NOT settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Find the 'aluno' profile linked to the reservation's 'profile_id'
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no 'aluno' profile is found, exit
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Calculate points to add
    points_to_add := 0;
    if settings.points_per_reservation > 0 then
        points_to_add := points_to_add + settings.points_per_reservation;
    end if;
    if settings.points_per_real > 0 and NEW.total_price > 0 then
        points_to_add := points_to_add + floor(NEW.total_price * settings.points_per_real);
    end if;

    -- If there are points to add, update the aluno's balance and record the transaction
    IF points_to_add > 0 THEN
        UPDATE public.alunos
        SET gamification_points = coalesce(gamification_points, 0) + points_to_add
        WHERE id = aluno_profile.id;

        INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
        VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Reserva finalizada', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger to call the corrected function.
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
