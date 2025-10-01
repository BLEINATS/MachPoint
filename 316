-- Definitive fix for gamification trigger and function
-- This script corrects a persistent syntax error in the trigger creation and a logic error in the function.

-- 1. Drop the existing trigger to avoid conflicts.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- 2. Drop the faulty function.
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 3. Recreate the function with the correct logic (using 'is_enabled').
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Exit if gamification is disabled or no settings found
    IF settings IS NULL OR NOT settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Find the 'aluno' profile linked to the reservation's 'profile_id'
    SELECT * INTO aluno_profile
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
    LIMIT 1;

    -- Exit if no 'aluno' profile is found
    IF aluno_profile IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate points based on settings
    points_to_add := settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * settings.points_per_real);

    -- Add points if there are any to add
    IF points_to_add > 0 THEN
        -- Use the dedicated function to add points and record the transaction
        PERFORM public.add_gamification_points(
            p_aluno_id := aluno_profile.id,
            p_points_to_add := points_to_add,
            p_description := 'Pontos por reserva #' || substr(NEW.id::text, 1, 8),
            p_related_reservation_id := NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Recreate the trigger with the CORRECT syntax (no semicolon in the WHEN clause).
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
