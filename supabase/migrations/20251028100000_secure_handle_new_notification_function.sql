/*
          # [Function Security] Secure handle_new_notification Function
          [This operation secures the handle_new_notification function by explicitly setting its search_path, mitigating a security warning.]

          ## Query Description: [This script will safely drop and recreate the trigger and function responsible for creating notifications on new reservations. It sets a fixed search_path to prevent potential hijacking vulnerabilities, making the system more secure. There is no impact on existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: `public.handle_new_notification()`
          - Trigger: `on_new_reservation_notify` on `public.reservas`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Recreated]
          - Estimated Impact: [Negligible. The function is lightweight and runs on inserts.]
          */

-- Drop the trigger first as it depends on the function
DROP TRIGGER IF EXISTS on_new_reservation_notify ON public.reservas;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_notification();

-- Recreate the function with the correct logic
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Insere uma notificação para o admin da arena
    INSERT INTO public.notificacoes (arena_id, message, type, link_to)
    VALUES (
        NEW.arena_id,
        'Nova reserva de ' || NEW.clientName || ' na quadra ' || (SELECT name FROM public.quadras WHERE id = NEW.quadra_id) || ' para ' || to_char(NEW.date, 'DD/MM') || ' às ' || NEW.start_time,
        'nova_reserva',
        '/reservas'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set the search_path for security
ALTER FUNCTION public.handle_new_notification() SET search_path = 'public';

-- Recreate the trigger
CREATE TRIGGER on_new_reservation_notify
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification();
