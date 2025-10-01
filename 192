/*
# [Function Security] Secure add_gamification_points function
This operation secures the `add_gamification_points` function by setting a fixed search path, mitigating potential security risks.

## Query Description: [This operation updates an existing database function to improve security. It does not alter data, but ensures the function's execution context is properly restricted. No backup is required, and the change is reversible.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.add_gamification_points(uuid, integer, text)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  SET search_path = 'public';

  INSERT INTO public.gamification_point_transactions (aluno_id, arena_id, points, type, description)
  SELECT
    p_aluno_id,
    a.arena_id,
    p_points_to_add,
    'manual_adjustment',
    p_description
  FROM public.alunos a
  WHERE a.id = p_aluno_id;
END;
$$;
