/*
          # [CRITICAL] Fix Gamification Points Update Trigger
          [This migration script corrects a critical syntax error in the function responsible for updating a user's gamification points and level. The previous version contained an invalid character that prevented the function from being created or updated correctly. This script safely removes the old trigger and function, then recreates them with the correct syntax, ensuring the gamification system works as intended.]

          ## Query Description: [This operation will temporarily drop and then recreate the trigger and function that automatically calculate and update a user's points and level after each transaction. This is a safe, non-destructive operation for user data. It is essential for fixing the gamification system's core logic.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Drops trigger: "on_gamification_transaction_change" on table "gamification_point_transactions"
          - Drops function: "update_aluno_gamification_points()"
          - Recreates function: "update_aluno_gamification_points()"
          - Recreates trigger: "on_gamification_transaction_change" on table "gamification_point_transactions"
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [Modified]
          - Estimated Impact: [Negligible. The trigger is temporarily inactive during the transaction but is immediately restored.]
          */

-- Drop the existing trigger first to remove dependency
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

-- Drop the faulty function
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with the correct syntax
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_total_points INT;
    v_new_level_id UUID;
BEGIN
    -- Calculate the total points for the aluno
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM public.gamification_point_transactions
    WHERE aluno_id = NEW.aluno_id;

    -- Update the total points on the aluno's record
    UPDATE public.alunos
    SET gamification_points = v_total_points
    WHERE id = NEW.aluno_id;

    -- Find the new level based on the total points
    SELECT id
    INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id
    AND points_required <= v_total_points
    ORDER BY points_required DESC
    LIMIT 1;

    -- Update the level on the aluno's record if it has changed
    UPDATE public.alunos
    SET gamification_level_id = v_new_level_id
    WHERE id = NEW.aluno_id
    AND (gamification_level_id IS NULL OR gamification_level_id <> v_new_level_id);

    RETURN NEW;
END;
$function$;

-- Recreate the trigger to call the corrected function
CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
