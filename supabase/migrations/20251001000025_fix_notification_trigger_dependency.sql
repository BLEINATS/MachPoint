-- Definitive fix for the reservation notification trigger
-- This script first removes the old triggers and function to avoid dependency errors,
-- then recreates them with the correct logic.

-- Step 1: Drop the existing triggers that depend on the function.
DROP TRIGGER IF EXISTS on_reservation_created ON public.reservas;
DROP TRIGGER IF EXISTS on_reservation_insert ON public.reservas;

-- Step 2: Drop the old function.
DROP FUNCTION IF EXISTS public.handle_new_reservation_notification();

-- Step 3: Recreate the function with correct logic and column name ("clientName").
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_profile RECORD;
    arena_name TEXT;
    creator_profile RECORD;
BEGIN
    -- Get arena name
    SELECT name INTO arena_name FROM public.arenas WHERE id = NEW.arena_id;
    -- Get creator's profile to check their role
    SELECT role INTO creator_profile FROM public.profiles WHERE id = auth.uid();

    -- Scenario 1: An admin is creating a reservation for a client.
    -- Notify the client.
    IF creator_profile.role = 'admin_arena' AND NEW.profile_id IS NOT NULL AND NEW.profile_id != auth.uid() THEN
        INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
        VALUES (NEW.arena_id, NEW.profile_id, 'Uma nova reserva em ' || arena_name || ' foi feita para você no dia ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time || '.', 'nova_reserva', '/perfil');
    END IF;

    -- Scenario 2: A client is creating a reservation for themselves.
    -- Notify all admins of the arena.
    IF creator_profile.role = 'cliente' THEN
        FOR admin_profile IN
            SELECT p.id
            FROM public.profiles p
            JOIN public.arenas a ON a.owner_id = p.id
            WHERE a.id = NEW.arena_id
        LOOP
            INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
            VALUES (NEW.arena_id, admin_profile.id, 'Nova reserva de ' || NEW."clientName" || ' na quadra ' || (SELECT name FROM quadras WHERE id = NEW.quadra_id) || ' para ' || to_char(NEW.date, 'DD/MM') || '.', 'nova_reserva', '/reservas');
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate a single, correct trigger.
CREATE TRIGGER on_reservation_created
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reservation_notification();

-- Grant execute on function to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_reservation_notification() TO authenticated;
