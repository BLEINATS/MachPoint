/*
          # [Operation Name]
          Secure `handle_reservation_completion` function

          ## Query Description: [This operation secures the `handle_reservation_completion` function by explicitly setting its `search_path`. This is a preventative security measure to mitigate potential risks, as recommended by Supabase security advisories. It involves temporarily dropping the dependent trigger, recreating the function with the security setting, and then recreating the trigger. There is no impact on existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function `handle_reservation_completion` will be dropped and recreated.
          - Trigger `on_reservation_completed_add_points` on table `reservas` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: Not changed
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Modified (dropped and recreated)
          - Estimated Impact: Negligible performance impact.
          */

-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with the security definer and search_path
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_aluno_id UUID;
    v_arena_id UUID;
    v_points_to_add INTEGER;
    v_description TEXT;
    v_settings RECORD;
BEGIN
    -- Check if the reservation status is updated to 'realizada'
    IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
        -- Get the arena_id from the new reservation record
        v_arena_id := NEW.arena_id;

        -- Fetch gamification settings for the arena
        SELECT is_enabled, points_per_reservation, points_per_real
        INTO v_settings
        FROM public.gamification_settings
        WHERE arena_id = v_arena_id;

        -- Proceed only if gamification is enabled
        IF v_settings.is_enabled THEN
            -- Find the corresponding aluno_id from the profile_id
            SELECT id INTO v_aluno_id
            FROM public.alunos
            WHERE profile_id = NEW.profile_id AND arena_id = v_arena_id;

            -- If an aluno record exists, calculate and add points
            IF v_aluno_id IS NOT NULL THEN
                v_points_to_add := 0;
                v_description := '';

                -- Add points per reservation
                IF v_settings.points_per_reservation > 0 THEN
                    v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
                    v_description := 'Pontos por reserva completada.';
                END IF;

                -- Add points based on the value of the reservation
                IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                    v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
                    v_description := v_description || ' Pontos por valor da reserva.';
                END IF;

                -- If there are points to add, call the function to add them
                IF v_points_to_add > 0 THEN
                    PERFORM public.add_gamification_points(
                        p_aluno_id := v_aluno_id,
                        p_points_to_add := v_points_to_add,
                        p_description := trim(v_description),
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
$$;

-- Recreate the trigger to call the function
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();
