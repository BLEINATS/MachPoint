-- 1. Drop the existing trigger and function to ensure a clean state
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 2. Recreate the function with the correct column name ('is_enabled')
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add int;
BEGIN
    -- Fetch gamification settings for the arena
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- Only proceed if the gamification system is enabled
    IF settings IS NOT NULL AND settings.is_enabled THEN
        -- Find the corresponding 'aluno' profile using the profile_id from the reservation
        SELECT * INTO aluno_profile FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

        IF aluno_profile IS NOT NULL THEN
            -- Calculate points based on settings
            points_to_add := settings.points_per_reservation + (NEW.total_price * settings.points_per_real);

            -- Use the safe function to add points and record the transaction
            PERFORM public.add_gamification_points(
                aluno_profile.id,
                points_to_add,
                'Reserva concluída #' || substr(NEW.id::text, 1, 8),
                'reservation_completed',
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Recreate the trigger with the correct syntax
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
