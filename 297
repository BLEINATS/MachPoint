-- This script fixes a typo in the notification trigger function that was preventing admins from creating reservations.

-- Drop the existing trigger and function to ensure a clean update
DROP TRIGGER IF EXISTS on_new_reservation_notification ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_new_reservation_notification();

-- Recreate the function with the correct column name ("clientName")
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
    arena_owner_id uuid;
    message_text text;
    quadra_name text;
BEGIN
    -- Get quadra name to use in messages
    SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;

    -- Find the arena owner
    SELECT owner_id INTO arena_owner_id FROM public.arenas WHERE id = NEW.arena_id;

    -- Notify the client if the reservation was made by an admin
    IF NEW.profile_id IS NOT NULL AND auth.uid() = arena_owner_id THEN
        message_text := 'Uma nova reserva foi feita para você na quadra ' || quadra_name || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time;
        INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
        VALUES (NEW.arena_id, NEW.profile_id, message_text, 'nova_reserva', '/perfil');
    END IF;

    -- Notify the admin if the reservation was made by a client
    IF NEW.profile_id IS NOT NULL AND auth.uid() != arena_owner_id THEN
        -- Use NEW."clientName" with quotes because of the camelCase column name
        message_text := 'Nova reserva de ' || NEW."clientName" || ' na quadra ' || quadra_name || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time;
        INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
        VALUES (NEW.arena_id, arena_owner_id, message_text, 'nova_reserva', '/reservas');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger to the reservations table
CREATE TRIGGER on_new_reservation_notification
AFTER INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.handle_new_reservation_notification();

-- Grant execute permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_reservation_notification() TO authenticated;
