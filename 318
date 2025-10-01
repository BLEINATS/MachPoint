-- 1. Drop the existing trigger to allow function replacement
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- 2. Drop the faulty function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- 3. Recreate the function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
    points_to_add INT;
    v_aluno_id UUID;
    is_gamification_enabled BOOLEAN;
BEGIN
    -- Check if gamification is enabled for the arena
    SELECT is_enabled INTO is_gamification_enabled
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- If gamification is not enabled or settings not found, exit
    IF NOT FOUND OR is_gamification_enabled = FALSE THEN
        RETURN NEW;
    END IF;

    -- Get the specific points rules for the arena
    SELECT points_per_reservation, points_per_real INTO settings
    FROM public.gamification_settings
    WHERE arena_id = NEW.arena_id;

    -- Calculate points
    points_to_add := settings.points_per_reservation + floor(NEW.total_price * settings.points_per_real);

    -- Find the aluno_id from the profile_id
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If aluno exists and points are to be added, update points and log transaction
    IF v_aluno_id IS NOT NULL AND points_to_add > 0 THEN
        -- Add points to the student's profile
        UPDATE public.alunos
        SET gamification_points = coalesce(gamification_points, 0) + points_to_add
        WHERE id = v_aluno_id;

        -- Log the transaction
        INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description, related_reservation_id)
        VALUES(NEW.arena_id, v_aluno_id, points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger to call the corrected function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status &lt;&gt; 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
