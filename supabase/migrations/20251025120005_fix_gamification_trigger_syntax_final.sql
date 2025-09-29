/*
      # [Fix] Recreate Gamification Points Update Function
      [This script corrects a syntax error in the `update_aluno_gamification_points` function by safely dropping and recreating it along with its dependent trigger. This ensures that a customer's total points and level are correctly updated automatically after any point transaction.]

      ## Query Description: [This operation will temporarily remove and then restore the automation that updates a user's gamification points. There is no risk to existing data, but for a brief moment during the migration, new point transactions would not update the total score. The script is designed to be atomic and fast to minimize this window.]
      
      ## Metadata:
      - Schema-Category: ["Structural"]
      - Impact-Level: ["Low"]
      - Requires-Backup: [false]
      - Reversible: [false]
      
      ## Structure Details:
      - Drops trigger `on_gamification_transaction_change` on `gamification_point_transactions`.
      - Drops function `update_aluno_gamification_points`.
      - Recreates function `update_aluno_gamification_points` with correct syntax.
      - Recreates trigger `on_gamification_transaction_change`.
      
      ## Security Implications:
      - RLS Status: [No Change]
      - Policy Changes: [No]
      - Auth Requirements: [None]
      
      ## Performance Impact:
      - Indexes: [No Change]
      - Triggers: [Modified]
      - Estimated Impact: [Negligible. The trigger is essential for data consistency and its performance is optimized.]
    */

-- Step 1: Drop the existing trigger and function to avoid conflicts.
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Step 2: Recreate the function with the correct syntax.
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
  v_aluno_id UUID;
  v_total_points INT;
  v_arena_id UUID;
  v_level_id UUID;
BEGIN
  -- Determine which record's aluno_id to use
  IF TG_OP = 'DELETE' THEN
    v_aluno_id := OLD.aluno_id;
    v_arena_id := OLD.arena_id;
  ELSE
    v_aluno_id := NEW.aluno_id;
    v_arena_id := NEW.arena_id;
  END IF;

  -- Calculate the new total points
  SELECT COALESCE(SUM(points), 0)
  INTO v_total_points
  FROM public.gamification_point_transactions
  WHERE aluno_id = v_aluno_id;

  -- Determine the new level based on total points
  SELECT id
  INTO v_level_id
  FROM public.gamification_levels
  WHERE arena_id = v_arena_id
    AND points_required &lt;= v_total_points
  ORDER BY points_required DESC
  LIMIT 1;

  -- Update the alunos table
  UPDATE public.alunos
  SET 
    gamification_points = v_total_points,
    gamification_level_id = v_level_id
  WHERE id = v_aluno_id;

  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger.
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
