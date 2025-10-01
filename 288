-- Definitive fix for is_active vs is_enabled typo in gamification trigger
-- This script safely drops the trigger, recreates the function with the correct field name, and re-adds the trigger.

-- Step 1: Drop the existing trigger to remove dependency
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Step 2: Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Step 3: Recreate the function with the correct logic (using is_enabled)
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    settings public.gamification_settings;
    aluno_profile public.alunos;
    points_to_add int;
BEGIN
    -- 1. Get the gamification settings for the arena
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- 2. Check if gamification is enabled using the correct column name 'is_enabled'
    IF settings.is_enabled THEN
        -- 3. Get the aluno profile
        SELECT * INTO aluno_profile FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

        IF FOUND THEN
            -- 4. Calculate points
            points_to_add := 0;
            IF settings.points_per_reservation > 0 THEN
                points_to_add := points_to_add + settings.points_per_reservation;
            END IF;
            IF settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                points_to_add := points_to_add + floor(NEW.total_price * settings.points_per_real);
            END IF;

            -- 5. Add points if there are any to add
            IF points_to_add > 0 THEN
                PERFORM public.add_gamification_points(aluno_profile.id, points_to_add, 'Reserva concluída');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Step 4: Recreate the trigger to execute the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
