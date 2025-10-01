/*
  # [Operation Name]
  [This operation secures the 'handle_reservation_completion' function by setting a fixed search_path, mitigating a security advisory.]
  ## Query Description: [This script safely drops and recreates a database function to apply security best practices. It modifies the function's definition to prevent potential search_path hijacking vulnerabilities, without altering its core logic or impacting existing data. This is a low-risk, preventative security enhancement.]
  ## Metadata:
  - Schema-Category: 'Security'
  - Impact-Level: 'Low'
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'handle_reservation_completion' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. This change only affects the function's security context.
*/
DROP FUNCTION IF EXISTS public.handle_reservation_completion();
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno RECORD;
    v_gamification_enabled BOOLEAN;
BEGIN
    IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
        -- Find the corresponding aluno profile
        SELECT * INTO v_aluno
        FROM public.alunos
        WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id
        LIMIT 1;

        -- If an aluno profile exists, proceed with gamification
        IF v_aluno IS NOT NULL THEN
            -- Check if gamification is enabled for the arena
            SELECT is_enabled INTO v_gamification_enabled
            FROM public.gamification_settings
            WHERE arena_id = NEW.arena_id;

            -- If enabled, add points
            IF v_gamification_enabled THEN
                PERFORM add_gamification_points(
                    v_aluno.id,
                    1, -- Number of reservations
                    'Reserva realizada',
                    'reservation_completed',
                    NEW.id,
                    NEW.arena_id
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
