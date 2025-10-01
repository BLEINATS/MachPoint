-- This script creates the trigger to award gamification points when a reservation is completed.
-- It's safe to run as it uses CREATE OR REPLACE and DROP IF EXISTS.
-- 1. Create the function that will be executed by the trigger.
CREATE OR REPLACE FUNCTION public.handle_completed_reservation_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings public.gamification_settings;
    v_points_to_add INT;
    v_aluno_id uuid;
BEGIN
    -- Step 1: Check if gamification is enabled for the arena.
    SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;
    IF NOT FOUND OR v_settings.is_enabled = FALSE THEN
        RETURN NEW; -- Gamification is off, do nothing.
    END IF;

    -- Step 2: Find the corresponding 'aluno' profile using the 'profile_id' from the reservation.
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    IF NOT FOUND THEN
        RETURN NEW; -- No student profile found for this user in this arena, do nothing.
    END IF;

    -- Step 3: Calculate the points to be awarded.
    v_points_to_add := v_settings.points_per_reservation + floor(COALESCE(NEW.total_price, 0) * v_settings.points_per_real);

    -- Step 4: Add the calculated points to the 'aluno' profile.
    IF v_points_to_add > 0 THEN
        UPDATE public.alunos
        SET gamification_points = coalesce(gamification_points, 0) + v_points_to_add
        WHERE id = v_aluno_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Drop any previous versions of the trigger to avoid conflicts.
DROP TRIGGER IF EXISTS on_reservation_completed ON public.reservas;

-- 3. Create the trigger that executes the function after a reservation is updated.
CREATE TRIGGER on_reservation_completed
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_completed_reservation_gamification();
