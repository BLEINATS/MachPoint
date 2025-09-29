/*
          # [Function Security Update]
          Sets the search_path for the `add_gamification_points` function.

          ## Query Description: [This operation modifies the `add_gamification_points` function to explicitly set the `search_path`. This is a security best practice that prevents potential hijacking of the function by malicious actors who might create objects with the same name in other schemas. This change does not affect the function's logic or data.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `add_gamification_points(uuid, integer, text)` is altered.
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Adiciona a transação de pontos
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    SELECT arena_id, id, p_points_to_add, 'manual_adjustment', p_description
    FROM public.alunos
    WHERE id = p_aluno_id;
END;
$function$;
