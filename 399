/*
# [SECURITY] Set Search Path for Gamification Functions
[This operation secures two functions related to credits and gamification by explicitly setting the search_path. This mitigates a security warning and prevents potential hijacking attacks.]

## Query Description: [This operation updates two existing database functions (`add_credit_to_aluno` and `add_gamification_points`) to make them more secure. It does not change their behavior or impact existing data. No backup is required.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions modified:
  - `public.add_credit_to_aluno(uuid, uuid, numeric)`
  - `public.add_gamification_points(uuid, integer, text)`

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [Not Changed]
- Mitigates: [Function Search Path Mutable warning]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact.]
*/

-- Secure the function for adding credits to a student
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;

-- Secure the function for adding gamification points
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.gamification_point_transactions (aluno_id, points, type, description)
    VALUES (p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$$;
