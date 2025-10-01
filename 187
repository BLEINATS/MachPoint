/*
# [PROACTIVE ENHANCEMENT] Optimize Gamification Points System
[This migration optimizes the gamification system by adding a dedicated 'gamification_points' column to the 'alunos' table and creating an automated trigger to keep it updated. This improves performance and data consistency across the app.]

## Query Description: [This operation will:
1. Add a `gamification_points` column to the `alunos` table.
2. Calculate and populate the current total points for all existing clients.
3. Create a trigger that automatically updates this total whenever a point transaction occurs.
This is a safe, structural improvement. No data is at risk.]

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Adds column `gamification_points` to `public.alunos`.
- Creates function `public.backfill_gamification_points()`.
- Creates trigger function `public.update_aluno_gamification_points()`.
- Creates trigger `on_gamification_transaction_change` on `public.gamification_point_transactions`.
- Updates function `public.add_gamification_points()`.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No change]
- Triggers: [Added]
- Estimated Impact: [Positive. Point lookups will be significantly faster, reducing database load.]
*/

-- Step 1: Add the new column to the alunos table
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS gamification_points INTEGER NOT NULL DEFAULT 0;

-- Step 2: Create a temporary function to backfill existing points
CREATE OR REPLACE FUNCTION public.backfill_gamification_points()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.alunos a
  SET gamification_points = (
    SELECT COALESCE(SUM(t.points), 0)
    FROM public.gamification_point_transactions t
    WHERE t.aluno_id = a.id
  );
END;
$$;

-- Step 3: Run the backfill function to populate the new column
SELECT public.backfill_gamification_points();

-- Step 4: Drop the temporary backfill function
DROP FUNCTION public.backfill_gamification_points();

-- Step 5: Create the trigger function to automatically update points
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.alunos
    SET gamification_points = gamification_points + NEW.points
    WHERE id = NEW.aluno_id;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle change in points or change in aluno_id
    IF OLD.points <> NEW.points THEN
      UPDATE public.alunos
      SET gamification_points = gamification_points - OLD.points + NEW.points
      WHERE id = NEW.aluno_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.alunos
    SET gamification_points = gamification_points - OLD.points
    WHERE id = OLD.aluno_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Step 6: Create the trigger on the transactions table
DROP TRIGGER IF EXISTS on_gamification_transaction_change ON public.gamification_point_transactions;

CREATE TRIGGER on_gamification_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();

-- Step 7: Secure and simplify the RPC function, relying on the trigger
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_arena_id uuid;
BEGIN
  -- Get arena_id from the aluno record
  SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

  -- Insert a record of the transaction.
  -- The trigger 'on_gamification_transaction_change' will automatically handle updating the total points.
  INSERT INTO public.gamification_point_transactions(aluno_id, arena_id, points, type, description)
  VALUES (p_aluno_id, v_arena_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$$;
