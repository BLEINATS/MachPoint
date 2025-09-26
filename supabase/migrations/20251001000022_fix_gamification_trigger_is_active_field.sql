-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_settings public.gamification_settings;
    v_points_to_add INT;
BEGIN
    -- Fetch gamification settings for the specific arena
    SELECT * INTO v_settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id
    LIMIT 1;

    -- If gamification is not enabled or no settings found, exit
    IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Calculate points based on reservation price and settings
    v_points_to_add := v_settings.points_per_reservation + floor(NEW.total_price * v_settings.points_per_real);

    -- If there are points to add, call the function to add them
    IF v_points_to_add > 0 THEN
        DECLARE
            v_aluno_id uuid;
        BEGIN
            -- Find the 'aluno' record using the 'profile_id' from the reservation
            SELECT id INTO v_aluno_id
            FROM public.alunos
            WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
            LIMIT 1;

            IF v_aluno_id IS NOT NULL THEN
                -- Call the function to add points and record the transaction
                PERFORM public.add_gamification_points(
                    v_aluno_id,
                    v_points_to_add,
                    'Pontos por reserva concluída'
                );
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error or handle it, but don't block the update
                RAISE NOTICE 'Could not add gamification points for aluno with profile_id %: %', NEW.profile_id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
