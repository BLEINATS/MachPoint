/*
# [SECURITY] Secure `handle_reservation_completion` Function
This operation secures the `handle_reservation_completion` function, which is responsible for awarding gamification points when a reservation is completed.

## Query Description: [This operation will temporarily drop and then recreate the trigger that uses this function. It sets a secure search path to prevent potential vulnerabilities. There is no risk to existing data, and the change is fully reversible.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Drops trigger: `on_reservation_completed_add_points` on table `reservas`.
- Recreates function: `handle_reservation_completion()`.
- Adds `SECURITY DEFINER` and sets `search_path`.
- Recreates trigger: `on_reservation_completed_add_points` on table `reservas`.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [Modified]
- Estimated Impact: [Negligible. The trigger is momentarily unavailable during the transaction but is restored immediately.]
*/

-- 1. Drop the existing trigger that depends on the function
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- 2. Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id UUID;
    v_arena_id UUID;
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Only run for 'confirmada' to 'realizada' transitions
    IF OLD.status = 'confirmada' AND NEW.status = 'realizada' THEN
        -- Find the corresponding aluno profile
        SELECT id, arena_id INTO v_aluno_id, v_arena_id
        FROM public.alunos
        WHERE profile_id = NEW.profile_id
        LIMIT 1;

        -- If an aluno profile exists for this user in this arena
        IF v_aluno_id IS NOT NULL THEN
            -- Get gamification settings for the arena
            SELECT is_enabled, points_per_reservation, points_per_real
            INTO v_settings
            FROM public.gamification_settings
            WHERE arena_id = v_arena_id
            LIMIT 1;

            -- If gamification is enabled
            IF v_settings.is_enabled THEN
                v_points_to_add := 0;

                -- Add points for the reservation itself
                IF v_settings.points_per_reservation > 0 THEN
                    v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
                END IF;

                -- Add points based on the value of the reservation
                IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                    v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
                END IF;

                -- If there are points to add, call the function
                IF v_points_to_add > 0 THEN
                    PERFORM public.add_gamification_points(
                        p_aluno_id := v_aluno_id,
                        p_points_to_add := v_points_to_add,
                        p_description := 'Conclusão da reserva #' || substr(NEW.id::text, 1, 8),
                        p_transaction_type := 'reservation_completed',
                        p_related_reservation_id := NEW.id,
                        p_arena_id := v_arena_id
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set a secure search path for the function
ALTER FUNCTION public.handle_reservation_completion() SET search_path = public;

-- 3. Recreate the trigger
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
