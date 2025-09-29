/*
  # [Fix] Create Gamification Transaction Type and Recreate Function
  [This migration creates the missing `gamification_point_transaction_type` ENUM and recreates the `add_gamification_points` function that depends on it. This resolves the "type does not exist" error during migration.]

  ## Query Description: [This operation is structural and safe. It defines a new data type required by the gamification system and updates a related function. It does not alter existing data.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Creates ENUM type `public.gamification_point_transaction_type`.
  - Recreates function `public.add_gamification_points`.
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [None]
*/

-- Step 1: Create the missing ENUM type for gamification point transactions.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gamification_point_transaction_type') THEN
        CREATE TYPE public.gamification_point_transaction_type AS ENUM (
            'reservation_completed',
            'manual_adjustment',
            'achievement_unlocked',
            'reward_redemption'
        );
    END IF;
END$$;


-- Step 2: Recreate the function that depends on this type.
-- This function adds points to a student's record and logs the transaction.
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text,
    p_type gamification_point_transaction_type DEFAULT 'manual_adjustment'::gamification_point_transaction_type,
    p_related_reservation_id uuid DEFAULT NULL::uuid,
    p_related_achievement_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_arena_id uuid;
BEGIN
    -- Get the arena_id from the aluno's profile
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno with ID % not found.', p_aluno_id;
    END IF;

    -- Insert the transaction record
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, related_reservation_id, related_achievement_id)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, p_type, p_description, p_related_reservation_id, p_related_achievement_id);

END;
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text, gamification_point_transaction_type, uuid, uuid) TO authenticated;
