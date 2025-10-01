/*
          # [Refactor] Secure Gamification Points Update Function
          This migration refactors the trigger function responsible for updating a student's total points and level when a gamification transaction occurs. It ensures the function is more secure and robust.

          ## Query Description: [This operation temporarily drops a trigger, updates a function, and recreates the trigger. It is a safe, non-destructive operation that improves security and maintainability.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Drops and recreates the `on_gamification_transaction_change` trigger on the `gamification_point_transactions` table.
          - Drops and recreates the `update_aluno_gamification_points()` function.
          - Sets a fixed `search_path` for the function to enhance security.
          
          ## Security Implications:
          - RLS Status: Not affected.
          - Policy Changes: No.
          - Auth Requirements: None.
          
          ## Performance Impact:
          - Indexes: Not affected.
          - Triggers: Recreated.
          - Estimated Impact: Negligible. This improves the security of an existing trigger.
          */

		-- Step 1: Drop the existing trigger that depends on the function.
		DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

		-- Step 2: Drop the existing function.
		DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

		-- Step 3: Recreate the function with security best practices.
		CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
		RETURNS TRIGGER AS $$
		DECLARE
			v_total_points INT;
			v_level_id UUID;
			v_aluno_id_to_update UUID;
		BEGIN
			-- Determine which aluno_id to update based on the operation
			IF (TG_OP = 'DELETE') THEN
				v_aluno_id_to_update := OLD.aluno_id;
			ELSE
				v_aluno_id_to_update := NEW.aluno_id;
			END IF;

			-- Calculate the new total points for the specific aluno
			SELECT COALESCE(SUM(points), 0)
			INTO v_total_points
			FROM public.gamification_point_transactions
			WHERE aluno_id = v_aluno_id_to_update;

			-- Find the corresponding level for the new total points
			SELECT id
			INTO v_level_id
			FROM public.gamification_levels
			WHERE points_required &lt;= v_total_points
			ORDER BY points_required DESC
			LIMIT 1;

			-- Update the aluno's total points and level
			UPDATE public.alunos
			SET 
				gamification_points = v_total_points,
				gamification_level_id = v_level_id
			WHERE id = v_aluno_id_to_update;

			RETURN NULL; -- Result is ignored since this is an AFTER trigger
		END;
		$$ LANGUAGE plpgsql SECURITY DEFINER;

		-- Set a secure search path for the function
		ALTER FUNCTION public.update_aluno_gamification_points() SET search_path = 'public';

		-- Step 4: Recreate the trigger to use the new function.
		CREATE TRIGGER on_gamification_transaction_change
		AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
		FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
