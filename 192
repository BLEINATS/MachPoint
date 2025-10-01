/*
# [Fix] Correct `add_gamification_points` function signature
[This migration fixes an error where a function could not be updated due to a parameter name change. It safely drops the old function and recreates it with the correct signature.]

## Query Description: [This operation will briefly drop and recreate the function responsible for adding gamification points. This is a safe, non-destructive operation that corrects a function definition mismatch. No user data will be affected.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops the old `add_gamification_points` function.
- Recreates the `add_gamification_points` function with corrected parameter names.

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/

-- Drop the existing function with the old signature
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text, public.gamification_point_transaction_type, uuid, uuid);

-- Recreate the function with the correct signature and logic
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text,
    p_transaction_type public.gamification_point_transaction_type,
    p_related_reservation_id uuid DEFAULT NULL,
    p_related_achievement_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.gamification_point_transactions (
        aluno_id,
        points,
        type,
        description,
        related_reservation_id,
        related_achievement_id,
        arena_id
    )
    SELECT
        p_aluno_id,
        p_points_to_add,
        p_transaction_type,
        p_description,
        p_related_reservation_id,
        p_related_achievement_id,
        a.arena_id
    FROM public.alunos a
    WHERE a.id = p_aluno_id;
END;
$$;

-- Grant execute permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text, public.gamification_point_transaction_type, uuid, uuid) TO authenticated;
