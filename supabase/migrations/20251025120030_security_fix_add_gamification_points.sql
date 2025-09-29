/*
# [SECURITY] Set Search Path for add_gamification_points
[This operation enhances security by explicitly setting the search_path for the specified function, preventing potential hijacking attacks.]

## Query Description: [This operation will alter the 'add_gamification_points' function to set a secure search_path. It is a non-destructive change that improves the function's security without affecting its logic or existing data. No backup is required.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.add_gamification_points(uuid, integer, text)

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert a new transaction record
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
$function$
;

ALTER FUNCTION public.add_gamification_points(uuid, integer, text) SET search_path = public;
