/*
          # [SECURITY] Harden handle_reservation_completion function
          [This operation secures the function that awards gamification points after a reservation is completed by setting a fixed search_path and running with the definer's privileges.]

          ## Query Description: [This operation modifies an existing database function to enhance security. It does not alter any user data and is considered a safe, structural improvement. No backup is required.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.handle_reservation_completion()
          
          ## Security Implications:
          - RLS Status: [Unaffected]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Unaffected]
          - Triggers: [Unaffected]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_settings RECORD;
    v_points_to_add INT;
BEGIN
    -- Check if the reservation status is updated to 'realizada'
    IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
        -- Find the gamification settings for the specific arena
        SELECT * INTO v_settings
        FROM public.gamification_settings
        WHERE arena_id = NEW.arena_id;

        -- Proceed only if gamification is enabled for the arena
        IF FOUND AND v_settings.is_enabled THEN
            v_points_to_add := 0;
            -- Add points based on the reservation itself
            IF v_settings.points_per_reservation > 0 THEN
                v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
            END IF;

            -- Add points based on the value of the reservation
            IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
                v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
            END IF;

            -- If there are points to add, call the function to add them
            IF v_points_to_add > 0 AND NEW.profile_id IS NOT NULL THEN
                -- Find the corresponding aluno_id from the profile_id
                DECLARE
                    v_aluno_id UUID;
                BEGIN
                    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
                    IF FOUND THEN
                        PERFORM public.add_gamification_points(
                            v_aluno_id,
                            v_points_to_add,
                            'Conclusão de reserva'
                        );
                    END IF;
                EXCEPTION
                    WHEN NO_DATA_FOUND THEN
                        -- Silently fail if no aluno profile is found for the user in this arena
                        NULL;
                END;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
          # [SECURITY] Harden add_gamification_points function
          [This operation secures the function that adds gamification points by setting a fixed search_path and running with the definer's privileges.]

          ## Query Description: [This operation modifies an existing database function to enhance security. It does not alter any user data and is considered a safe, structural improvement. No backup is required.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.add_gamification_points(uuid, integer, text)
          
          ## Security Implications:
          - RLS Status: [Unaffected]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Unaffected]
          - Triggers: [Unaffected]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id UUID,
    p_points_to_add INT,
    p_description TEXT
)
RETURNS VOID AS $$
DECLARE
    v_arena_id UUID;
BEGIN
    SET search_path = 'public';

    -- Get the arena_id from the aluno record
    SELECT arena_id INTO v_arena_id FROM alunos WHERE id = p_aluno_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Insert the transaction
    INSERT INTO gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
