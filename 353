/*
  # [Function Update] add_gamification_points
  [This operation updates the 'add_gamification_points' function to set a fixed search_path, mitigating a security warning.]

  ## Query Description: [Updates the function to prevent potential search_path hijacking attacks by explicitly setting the schema search order. This is a security enhancement and does not change the function's logic or impact existing data.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  [Affects the definition of the 'add_gamification_points' function.]
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [SECURITY DEFINER]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible performance impact.]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_arena_id uuid;
    v_type gamification_point_transaction_type;
BEGIN
    -- Get the arena_id from the aluno's profile
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;
    
    -- Determine transaction type based on description
    IF p_description LIKE 'Resgate:%' THEN
        v_type := 'reward_redemption';
    ELSIF p_description LIKE 'Conquista:%' THEN
        v_type := 'achievement_unlocked';
    ELSIF p_description LIKE 'Reserva concluída%' THEN
        v_type := 'reservation_completed';
    ELSE
        v_type := 'manual_adjustment';
    END IF;

    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_type, p_description);
END;
$$;


/*
  # [Function Update] is_arena_admin
  [This operation updates the 'is_arena_admin' function to set a fixed search_path, mitigating a security warning.]

  ## Query Description: [Updates the function to prevent potential search_path hijacking attacks by explicitly setting the schema search order. This is a security enhancement and does not change the function's logic or impact existing data.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  [Affects the definition of the 'is_arena_admin' function.]
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [SECURITY DEFINER]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible performance impact.]
*/
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check if the current user is the owner of the specified arena
    RETURN EXISTS (
        SELECT 1
        FROM public.arenas
        WHERE id = p_arena_id AND owner_id = auth.uid()
    );
END;
$$;
