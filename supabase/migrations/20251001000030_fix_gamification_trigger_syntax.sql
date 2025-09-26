-- Drop the trigger first, as it depends on the function.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the old function.
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the correct logic.
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add INT;
BEGIN
    -- Fetch gamification settings for the specific arena
    SELECT * INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id
    LIMIT 1;

    -- Only proceed if gamification is enabled for the arena
    IF FOUND AND settings.is_enabled THEN
        -- Find the corresponding 'aluno' profile
        SELECT * INTO aluno_profile
        FROM public.alunos
        WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
        LIMIT 1;

        -- If an aluno profile exists, calculate and add points
        IF FOUND THEN
            points_to_add := settings.points_per_reservation + floor(NEW.total_price * settings.points_per_real);

            -- Ensure points are not negative
            IF points_to_add > 0 THEN
                -- Use the RPC function to add points and create a transaction record
                PERFORM public.add_gamification_points(
                    p_aluno_id := aluno_profile.id,
                    p_points_to_add := points_to_add,
                    p_description := 'Pontos por reserva concluída',
                    p_type := 'reservation_completed',
                    p_related_reservation_id := NEW.id
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with the correct syntax
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
