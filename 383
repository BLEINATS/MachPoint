/*
# [SECURITY] Set search_path for handle_reservation_completion function

## Query Description:
This operation secures the `handle_reservation_completion` function by explicitly setting its `search_path`. This prevents potential security vulnerabilities where the function could be tricked into executing malicious code from other schemas. The existing trigger that uses this function will be temporarily removed and then recreated to ensure the update is applied correctly without breaking dependencies. This change does not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops the trigger `on_reservation_completed_add_points` on the `reservas` table.
- Drops the function `handle_reservation_completion()`.
- Recreates the function `handle_reservation_completion()` with `SET search_path = ''`.
- Recreates the trigger `on_reservation_completed_add_points` to use the new, secure function.

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: None
- Mitigates "Function Search Path Mutable" warning by isolating the function's execution context.

## Performance Impact:
- Indexes: None
- Triggers: Recreated
- Estimated Impact: Negligible. There might be a brief moment during the transaction where the trigger is inactive, but this is atomic and should not impact application functionality.
*/

-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with a secure search_path
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_aluno_id UUID;
    v_arena_id UUID;
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Only run for confirmed reservations that are being marked as 'realizada'
    IF OLD.status = 'confirmada' AND NEW.status = 'realizada' THEN
        -- Find the corresponding aluno profile
        SELECT id, arena_id INTO v_aluno_id, v_arena_id
        FROM public.alunos
        WHERE profile_id = NEW.profile_id
        LIMIT 1;

        -- If an aluno profile exists, proceed
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
                
                -- Add points for the reservation itself
                IF v_settings.points_per_reservation > 0 THEN
                    v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
                END IF;

                -- Add points based on the reservation value
                IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                    v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
                END IF;

                -- If there are points to add, call the function
                IF v_points_to_add > 0 THEN
                    PERFORM public.add_gamification_points(
                        v_aluno_id,
                        v_points_to_add,
                        'Pontos por reserva realizada',
                        'reservation_completed',
                        NEW.id
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
