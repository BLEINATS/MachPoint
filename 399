/*
  # [SECURITY] Set Search Path for Functions
  [This operation sets a fixed search_path for database functions to mitigate potential security risks, as recommended by Supabase security advisories.]

  ## Query Description: [This operation modifies existing database functions to explicitly set the 'search_path'. This is a security best practice that prevents potential hijacking of function calls. It does not alter the function's logic or impact data. This change is safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Functions affected:
    - add_gamification_points(uuid, integer, text)
    - is_arena_admin(uuid)

  ## Security Implications:
  - RLS Status: [No change]
  - Policy Changes: [No]
  - Auth Requirements: [No change]

  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/

-- Function: add_gamification_points
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.gamification_point_transactions (aluno_id, arena_id, points, type, description)
    SELECT
        p_aluno_id,
        a.arena_id,
        p_points_to_add,
        'manual_adjustment'::public.gamification_transaction_type,
        p_description
    FROM public.alunos a
    WHERE a.id = p_aluno_id;
END;
$function$;

-- Function: is_arena_admin
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
END;
$function$;
