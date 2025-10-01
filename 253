-- Drop the existing trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct field name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
    points_to_add INT;
    aluno_profile RECORD;
BEGIN
    -- Find the gamification settings for the specific arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id
    LIMIT 1;

    -- Only proceed if gamification is enabled for the arena
    IF FOUND AND settings.is_enabled THEN
        -- Find the corresponding 'aluno' profile using the 'profile_id' from the reservation
        SELECT * INTO aluno_profile
        FROM public.alunos
        WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
        LIMIT 1;

        -- Only proceed if an 'aluno' profile is found
        IF FOUND THEN
            -- Calculate points based on settings
            points_to_add := settings.points_per_reservation + (NEW.total_price * settings.points_per_real);

            -- Add points to the aluno's balance
            UPDATE public.alunos
            SET gamification_points = COALESCE(gamification_points, 0) + points_to_add
            WHERE id = aluno_profile.id;

            -- Insert a record into the transaction history
            INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
            VALUES(NEW.arena_id, aluno_profile.id, points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
