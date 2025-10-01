/*
# [FIX] Correct Notification Trigger Dependency
[This operation safely updates the notification function by temporarily removing and then recreating the dependent trigger.]

## Query Description: [This script resolves a dependency error by first dropping the `on_new_reservation_notify` trigger, then replacing the outdated `handle_new_notification` function with the correct `handle_new_reservation_notification` version, and finally recreating the trigger to use the new function. This ensures the notification system is consistent and secure.]

## Metadata:
- Schema-Category: ["Structural", "Fix"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops trigger `on_new_reservation_notify` on table `reservas`.
- Drops function `handle_new_notification()`.
- Creates function `handle_new_reservation_notification()`.
- Recreates trigger `on_new_reservation_notify` on table `reservas`.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Superuser]

## Performance Impact:
- Indexes: [No change]
- Triggers: [Recreated]
- Estimated Impact: [None]
*/

-- Step 1: Drop the existing trigger that depends on the old function.
DROP TRIGGER IF EXISTS on_new_reservation_notify ON public.reservas;

-- Step 2: Drop the old function that we need to replace.
DROP FUNCTION IF EXISTS public.handle_new_notification();

-- Step 3: Create the new, correct version of the notification function.
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert a notification for the arena admin
  INSERT INTO public.notificacoes (arena_id, message, type, link_to)
  VALUES (
    NEW.arena_id,
    'Nova reserva de ' || COALESCE(NEW.clientName, 'Cliente') || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time,
    'nova_reserva',
    '/reservas'
  );

  -- If the reservation has a linked profile, notify the client too
  IF NEW.profile_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (profile_id, arena_id, message, type, link_to)
    VALUES (
      NEW.profile_id,
      NEW.arena_id,
      'Sua reserva para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time || ' foi confirmada!',
      'nova_reserva',
      '/perfil'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger to use the new function.
CREATE TRIGGER on_new_reservation_notify
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reservation_notification();
