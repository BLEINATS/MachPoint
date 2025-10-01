/*
          # [Function Security] Secure handle_reservation_completion Function
          [This migration secures the 'handle_reservation_completion' function by setting a fixed search_path and defining it as a SECURITY DEFINER. This addresses a 'Function Search Path Mutable' security advisory.]

          ## Query Description: [This operation temporarily drops a trigger, updates a function, and recreates the trigger. It is a safe, non-destructive operation that improves security by preventing potential search_path hijacking attacks. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.handle_reservation_completion()
          - Trigger: on_reservation_completed_add_points on public.reservas
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [Modified (dropped and recreated)]
          - Estimated Impact: [Negligible performance impact.]
          */

-- Step 1: Drop the dependent trigger
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Step 3: Recreate the function with security enhancements
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id UUID;
    v_arena_id UUID;
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Only run for confirmed reservations being marked as 'realizada'
    IF OLD.status = 'confirmada' AND NEW.status = 'realizada' THEN
        -- Find the corresponding aluno profile
        SELECT id, arena_id INTO v_aluno_id, v_arena_id
        FROM public.alunos
        WHERE profile_id = NEW.profile_id
        LIMIT 1;

        -- If an aluno profile is found, proceed with gamification logic
        IF v_aluno_id IS NOT NULL THEN
            -- Get gamification settings for the arena
            SELECT is_enabled, points_per_reservation, points_per_real
            INTO v_settings
            FROM public.gamification_settings
            WHERE arena_id = v_arena_id
            LIMIT 1;

            -- Check if gamification is enabled
            IF v_settings.is_enabled THEN
                v_points_to_add := 0;

                -- Add points per reservation
                IF v_settings.points_per_reservation > 0 THEN
                    v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
                END IF;

                -- Add points per real spent
                IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                    v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
                END IF;

                -- If there are points to add, call the function
                IF v_points_to_add > 0 THEN
                    PERFORM public.add_gamification_points(
                        p_aluno_id := v_aluno_id,
                        p_points_to_add := v_points_to_add,
                        p_description := 'Conclusão da reserva #' || substr(NEW.id::text, 1, 8),
                        p_type := 'reservation_completed',
                        p_related_reservation_id := NEW.id,
                        p_arena_id := v_arena_id
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
