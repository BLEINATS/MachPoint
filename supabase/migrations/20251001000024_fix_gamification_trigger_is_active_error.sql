-- Drop the dependent trigger first to allow function modification
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_aluno RECORD;
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Find the corresponding 'aluno' profile for the reservation
    SELECT * INTO v_aluno
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no 'aluno' profile is found, exit
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Get gamification settings for the arena, using the correct column name 'is_enabled'
    SELECT is_enabled, points_per_reservation, points_per_real INTO v_settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- If gamification is not enabled or no settings are found, exit
    IF NOT FOUND OR NOT v_settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Calculate points to add
    v_points_to_add := v_settings.points_per_reservation + floor(NEW.total_price * v_settings.points_per_real);

    -- If there are points to add, update the aluno's points and create a transaction record
    IF v_points_to_add > 0 THEN
        UPDATE public.alunos
        SET gamification_points = COALESCE(gamification_points, 0) + v_points_to_add
        WHERE id = v_aluno.id;

        INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
        VALUES(NEW.arena_id, v_aluno.id, v_points_to_add, 'reservation_completed', 'Reserva #' || substr(NEW.id::text, 1, 8), NEW.id);
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
