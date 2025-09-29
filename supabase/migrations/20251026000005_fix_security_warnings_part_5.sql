/*
# [SECURITY] Set Search Path for is_arena_admin Function
[This operation enhances security by explicitly setting the search_path for the is_arena_admin function, preventing potential hijacking attacks.]

## Query Description: [This operation redefines the `is_arena_admin` function to include a `SET search_path = 'public'`. This is a safe, non-destructive change that improves the function's security without altering its behavior or affecting any data.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.is_arena_admin(uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE owner_id = p_user_id
  );
END;
$$;

/*
# [SECURITY] Set Search Path for handle_reservation_completion
[This operation enhances security by explicitly setting the search_path for the handle_reservation_completion trigger function.]

## Query Description: [This operation redefines the `handle_reservation_completion` function to include a `SET search_path = 'public'`. This is a safe, non-destructive change that improves the function's security without altering its behavior or affecting any data.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.handle_reservation_completion()`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Modified]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_aluno_id uuid;
    v_arena_id uuid;
    v_settings record;
    v_points_to_add integer;
BEGIN
    -- Only run for confirmed reservations being updated to 'realizada'
    IF TG_OP = 'UPDATE' AND OLD.status = 'confirmada' AND NEW.status = 'realizada' THEN
        v_arena_id := NEW.arena_id;

        -- Check if gamification is enabled for the arena
        SELECT is_enabled, points_per_reservation, points_per_real
        INTO v_settings
        FROM public.gamification_settings
        WHERE arena_id = v_arena_id;

        -- If gamification is not enabled, exit
        IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
            RETURN NEW;
        END IF;

        -- Find the aluno_id from the profile_id
        IF NEW.profile_id IS NOT NULL THEN
            SELECT id INTO v_aluno_id
            FROM public.alunos
            WHERE profile_id = NEW.profile_id AND arena_id = v_arena_id;
        END IF;

        -- If no aluno profile is linked, exit
        IF v_aluno_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Calculate points
        v_points_to_add := v_settings.points_per_reservation + floor(NEW.total_price * v_settings.points_per_real);

        -- Add points if any
        IF v_points_to_add > 0 THEN
            PERFORM public.add_gamification_points(
                v_aluno_id,
                v_points_to_add,
                'Pontos por reserva realizada',
                NEW.id
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;
