/*
# [Function Security] Secure add_gamification_points function
[This operation secures the `add_gamification_points` function by setting a fixed search path, preventing potential hijacking vulnerabilities.]

## Query Description: [This operation will safely drop and recreate the `add_gamification_points` function. It sets a secure `search_path` to prevent unauthorized code execution. There is no risk to existing data, but it is a structural change to a database function.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
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
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text);

-- Recreate the function with a secure search path
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_arena_id uuid;
  v_transaction_type gamification_point_transaction_type;
BEGIN
  -- Get the arena_id from the aluno's profile
  SELECT arena_id INTO v_arena_id
  FROM public.alunos
  WHERE id = p_aluno_id;

  IF v_arena_id IS NULL THEN
    RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
  END IF;

  -- Determine transaction type based on points
  IF p_points_to_add > 0 THEN
    v_transaction_type := 'manual_adjustment';
  ELSE
    v_transaction_type := 'reward_redemption';
  END IF;

  -- Insert the transaction
  INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
  VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_transaction_type, p_description);

END;
$$;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text) TO authenticated;
