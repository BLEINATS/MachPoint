/*
# [Function Security] Secure add_gamification_points function
This operation enhances the security of the `add_gamification_points` function by setting a fixed `search_path`.

## Query Description: [This operation secures the function that manually adjusts gamification points by setting a fixed `search_path`. This prevents potential hijacking of the function by malicious actors who might alter the search path to execute unintended code. This is a non-destructive security enhancement.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies the `add_gamification_points` function.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Authenticated user with appropriate permissions]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_arena_id uuid;
BEGIN
    -- Get arena_id from aluno profile
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    -- Insert into transaction history
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);

    -- The trigger on gamification_point_transactions will handle updating the total points.
END;
$$;
