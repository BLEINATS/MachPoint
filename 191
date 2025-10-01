/*
  # [Fix] Recreate Notification Function and Trigger
  [This script recreates the missing `handle_new_notification` function and the associated trigger to ensure that new reservations correctly generate notifications for the arena administrators.]

  ## Query Description: [This operation will first drop any existing notification trigger on the reservations table to avoid conflicts, then create the necessary function and re-attach the trigger. It is a safe structural change and will not affect existing data.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Drops trigger: `on_new_reservation_notify` on table `public.reservas`
  - Creates function: `public.handle_new_notification()`
  - Creates trigger: `on_new_reservation_notify` on table `public.reservas`
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [Modified]
  - Estimated Impact: [Negligible. Adds a very small overhead on new reservation inserts.]
*/

-- Step 1: Drop the existing trigger if it exists to avoid conflicts.
DROP TRIGGER IF EXISTS on_new_reservation_notify ON public.reservas;

-- Step 2: Create the missing notification handler function.
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  quadra_name TEXT;
BEGIN
  -- Get the name of the court for the notification message
  SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;

  -- Insert a notification for the arena admin (profile_id is NULL)
  INSERT INTO public.notificacoes (arena_id, message, type, link_to)
  VALUES (
    NEW.arena_id,
    'Nova reserva para ' || NEW.clientName || ' na quadra ' || COALESCE(quadra_name, 'Desconhecida') || ' às ' || NEW.start_time,
    'nova_reserva',
    '/reservas?date=' || NEW.date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search_path to an empty value for security
ALTER FUNCTION public.handle_new_notification() SET search_path = '';

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_notification() TO authenticated;


-- Step 3: Recreate the trigger on the reservations table.
CREATE TRIGGER on_new_reservation_notify
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification();
