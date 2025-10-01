/*
# [Function] Secure `add_gamification_points`
This operation secures the `add_gamification_points` function by setting a fixed search path and defining it as a security definer.

## Query Description: [This operation will redefine the `add_gamification_points` function to enhance security. It ensures the function runs with consistent permissions and prevents potential search path hijacking attacks. No data will be modified, and functionality remains the same.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: `public.add_gamification_points`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact.]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.gamification_point_transactions (aluno_id, arena_id, points, type, description)
    SELECT
        p_aluno_id,
        a.arena_id,
        p_points_to_add,
        'manual_adjustment'::public.gamification_point_transaction_type,
        p_description
    FROM public.alunos a
    WHERE a.id = p_aluno_id;
END;
$$;
