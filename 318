-- Drop the old trigger(s) to remove dependency
DROP TRIGGER IF EXISTS on_reservation_created ON public.reservas;
DROP TRIGGER IF EXISTS on_new_reservation ON public.reservas;
DROP TRIGGER IF EXISTS on_new_reservation_check_achievements ON public.reservas;

-- Drop the faulty function(s)
DROP FUNCTION IF EXISTS public.handle_new_reservation_notification();
DROP FUNCTION IF EXISTS public.check_new_reservation_achievements();
DROP FUNCTION IF EXISTS public.handle_new_reservation_notification_and_achievements();

-- Recreate the combined function with the correct column name 'is_enabled'
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification_and_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_profile_id uuid;
    notification_message text;
    settings public.gamification_settings;
    reservation_count int;
    achievement_record public.gamification_achievements;
    aluno_record public.alunos;
    already_unlocked boolean;
BEGIN
    -- ========== Notification Logic ==========
    -- Get the owner_id of the arena
    SELECT owner_id INTO admin_profile_id FROM arenas WHERE id = NEW.arena_id;

    -- Notify the admin that a client made a reservation
    IF NEW.created_by_name IS NOT NULL AND NEW.profile_id IS NOT NULL AND auth.uid() = NEW.profile_id THEN
        notification_message := NEW.clientName || ' fez uma nova reserva para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time;
        INSERT INTO notificacoes(arena_id, profile_id, message, type, link_to)
        VALUES(NEW.arena_id, admin_profile_id, notification_message, 'nova_reserva', '/reservas');
    END IF;

    -- Notify the client that an admin made a reservation for them
    IF NEW.created_by_name IS NOT NULL AND NEW.profile_id IS NOT NULL AND auth.uid() <> NEW.profile_id THEN
        notification_message := 'Uma nova reserva foi criada para você por ' || NEW.created_by_name || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time;
        INSERT INTO notificacoes(arena_id, profile_id, message, type, link_to)
        VALUES(NEW.arena_id, NEW.profile_id, notification_message, 'nova_reserva', '/perfil');
    END IF;

    -- ========== Gamification Logic ==========
    -- Exit if no profile is associated with the reservation
    IF NEW.profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get gamification settings
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- Exit if gamification is not enabled
    IF settings IS NULL OR NOT settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Get the corresponding aluno record
    SELECT * INTO aluno_record FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    IF aluno_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check for "First Reservation" achievement
    SELECT * INTO achievement_record FROM public.gamification_achievements WHERE type = 'first_reservation' AND arena_id = NEW.arena_id;
    IF achievement_record IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM public.aluno_achievements WHERE aluno_id = aluno_record.id AND achievement_id = achievement_record.id) INTO already_unlocked;
        IF NOT already_unlocked THEN
            SELECT COUNT(*) INTO reservation_count FROM public.reservas WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id AND status <> 'cancelada';
            IF reservation_count = 1 THEN
                -- Grant achievement and points
                INSERT INTO public.aluno_achievements (aluno_id, achievement_id) VALUES (aluno_record.id, achievement_record.id);
                PERFORM public.add_gamification_points(aluno_record.id, achievement_record.points_reward, 'Conquista: ' || achievement_record.name);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger to call the new combined function
CREATE TRIGGER on_new_reservation
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reservation_notification_and_achievements();

-- Grant execute on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_reservation_notification_and_achievements() TO authenticated;
