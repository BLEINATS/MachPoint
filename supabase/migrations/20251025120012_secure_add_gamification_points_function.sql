/*
  # [SECURITY] Set search_path for add_gamification_points
  [This operation secures the 'add_gamification_points' function by explicitly setting its search path, mitigating potential security risks related to search path hijacking.]

  ## Query Description: [This is a non-destructive security enhancement. It ensures that the function operates within a trusted schema context, preventing unauthorized code execution. No data will be modified, and the function's behavior remains unchanged.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function `public.add_gamification_points(uuid, integer, text)` will be altered.
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Not Applicable]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Insert a record of the transaction
  INSERT INTO public.gamification_point_transactions(aluno_id, points, type, description, arena_id)
  SELECT
    p_aluno_id,
    p_points_to_add,
    'manual_adjustment',
    p_description,
    a.arena_id
  FROM public.alunos a
  WHERE a.id = p_aluno_id;
END;
$function$;
