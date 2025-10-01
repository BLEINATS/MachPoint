/*
          # [Operation Name]
          Recreate reservation completion function and trigger

          ## Query Description: [This operation safely updates a database function by temporarily removing a dependent trigger, updating the function, and then recreating the trigger. This ensures the system remains consistent and avoids data integrity issues. No backup is required as it's a structural change.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops trigger `on_reservation_completed_add_points` on `reservas` table.
          - Drops function `handle_reservation_completion`.
          - Recreates function `handle_reservation_completion` with updated logic.
          - Recreates trigger `on_reservation_completed_add_points` on `reservas` table.
          
          ## Security Implications:
          - RLS Status: Not changed
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Recreated
          - Estimated Impact: Negligible performance impact.
          */

-- Step 1: Drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Step 3: Recreate the function with the correct logic and security settings
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_arena_id UUID;
    v_aluno_id UUID;
    v_total_price REAL;
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Check if the status was changed to 'realizada'
    IF NEW.status = 'realizada' AND OLD.status != 'realizada' THEN
        -- Get arena_id and total_price from the reservation
        v_arena_id := NEW.arena_id;
        v_total_price := NEW.total_price;

        -- Find the corresponding aluno using profile_id
        IF NEW.profile_id IS NOT NULL THEN
            SELECT id INTO v_aluno_id
            FROM public.alunos
            WHERE profile_id = NEW.profile_id AND arena_id = v_arena_id
            LIMIT 1;
        END IF;

        -- If an aluno is found, proceed with gamification logic
        IF v_aluno_id IS NOT NULL THEN
            -- Check if gamification is enabled for the arena
            SELECT is_enabled, points_per_reservation, points_per_real
            INTO v_settings
            FROM public.gamification_settings
            WHERE arena_id = v_arena_id;

            IF FOUND AND v_settings.is_enabled THEN
                -- Calculate points
                v_points_to_add := v_settings.points_per_reservation + floor(v_total_price * v_settings.points_per_real);

                -- Add points if the calculated amount is greater than 0
                IF v_points_to_add > 0 THEN
                    -- Use the existing function to add points and create a transaction record
                    PERFORM public.add_gamification_points(
                        v_aluno_id,
                        v_points_to_add,
                        'Conclusão da reserva #' || substr(NEW.id::text, 1, 8)
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 4: Recreate the trigger to call the updated function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
