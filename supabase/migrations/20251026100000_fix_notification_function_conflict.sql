/*
# [DATABASE] Fix Notification Function Conflict
This operation resolves a conflict by removing old notification functions and ensuring the correct one is in place.

## Query Description: [This operation will drop outdated functions (`handle_new_notification`) that are causing errors and recreate the current, correct function (`handle_new_reservation_notification`) used by the system. This is a safe cleanup operation to ensure database stability.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops old `handle_new_notification` function.
- Recreates the `handle_new_reservation_notification` function and its trigger.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No change]
- Triggers: [Recreated]
- Estimated Impact: [None]
*/

-- Drop the old, problematic function if it exists
DROP FUNCTION IF EXISTS public.handle_new_notification();

-- Recreate the correct function and trigger to ensure consistency

-- 1. Create the function to be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert a notification for the arena admin
    INSERT INTO public.notificacoes (arena_id, message, type, link_to)
    VALUES (
        NEW.arena_id,
        'Nova reserva de ' || COALESCE(NEW.clientName, 'Cliente') || ' na quadra ' || (SELECT name FROM quadras WHERE id = NEW.quadra_id) || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time,
        'nova_reserva',
        '/reservas'
    );

    -- If the reservation is made by a client with a profile, notify them too
    IF NEW.profile_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (profile_id, arena_id, message, type, link_to)
        VALUES (
            NEW.profile_id,
            NEW.arena_id,
            'Sua reserva na quadra ' || (SELECT name FROM quadras WHERE id = NEW.quadra_id) || ' para ' || to_char(NEW.date, 'DD/MM') || ' foi confirmada!',
            'nova_reserva',
            '/perfil'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Drop the existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_new_reservation_send_notification ON public.reservas;

-- 3. Recreate the trigger to call the function
CREATE TRIGGER on_new_reservation_send_notification
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reservation_notification();

GRANT EXECUTE ON FUNCTION public.handle_new_reservation_notification() TO authenticated;
