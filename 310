-- Definitive fix for gamification trigger error
-- This script corrects the field name from 'is_active' to 'is_enabled' in the handle_reservation_completion function.

-- Step 1: Drop the existing trigger that depends on the faulty function.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Step 2: Drop the faulty function.
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Step 3: Recreate the function with the CORRECT field name ('is_enabled').
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings public.gamification_settings;
    aluno_record public.alunos;
    points_to_add INT;
BEGIN
    -- Get gamification settings for the arena
    SELECT *
    INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- If no settings or gamification is disabled, do nothing
    IF NOT FOUND OR NOT settings.is_enabled THEN -- Corrected from is_active to is_enabled
        RETURN NEW;
    END IF;

    -- Find the corresponding 'aluno' record using the 'profile_id' from the reservation
    IF NEW.profile_id IS NULL THEN
        RETURN NEW; -- Cannot award points without a linked profile
    END IF;

    SELECT *
    INTO aluno_record
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no 'aluno' record found, do nothing
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Calculate points based on settings
    points_to_add := settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * settings.points_per_real);

    -- If there are points to add, update the aluno's balance and log the transaction
    IF points_to_add > 0 THEN
        UPDATE public.alunos
        SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
        WHERE id = aluno_record.id;

        INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
        VALUES(NEW.arena_id, aluno_record.id, points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger to call the corrected function.
-- This trigger fires when a reservation's status is updated TO 'realizada'.
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_reservation_completion() TO authenticated;
