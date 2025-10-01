/*
# [SECURITY] Fix Function Search Path for Gamification
[This migration secures gamification-related database functions by setting a fixed `search_path`, preventing potential hijacking vulnerabilities as recommended by Supabase security advisories.]

## Query Description: [This operation redefines the `add_gamification_points` and `handle_reservation_completion` functions to include a `SET search_path` clause. This is a safe, non-destructive change that improves security without affecting functionality or data.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions being altered:
  - `public.add_gamification_points(uuid, integer, text)`
  - `public.handle_reservation_completion()`
- Triggers being altered:
  - `on_reservation_completed_add_points`

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Unaffected]
- Triggers: [Recreated]
- Estimated Impact: [None]
*/

-- Secure add_gamification_points function
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.gamification_point_transactions (aluno_id, points, type, description, arena_id)
  SELECT p_aluno_id, p_points_to_add, 'manual_adjustment', p_description, arena_id
  FROM public.alunos
  WHERE id = p_aluno_id;
END;
$$;

-- Secure handle_reservation_completion function
-- This requires dropping the trigger first
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno RECORD;
  v_settings RECORD;
  v_points_to_add INT := 0;
BEGIN
  -- Only run for confirmed reservations being marked as 'realizada'
  IF NEW.status = 'realizada' AND OLD.status = 'confirmada' THEN
    -- Find the corresponding aluno profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    
    -- If no aluno profile, exit
    IF v_aluno IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get gamification settings for the arena
    SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- If gamification is not enabled, exit
    IF v_settings IS NULL OR v_settings.is_enabled = FALSE THEN
      RETURN NEW;
    END IF;

    -- Calculate points
    v_points_to_add := v_settings.points_per_reservation;
    IF NEW.total_price IS NOT NULL AND NEW.total_price > 0 THEN
      v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
    END IF;

    -- Insert point transaction
    IF v_points_to_add > 0 THEN
      INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, related_reservation_id)
      VALUES (NEW.arena_id, v_aluno.id, v_points_to_add, 'reservation_completed', 'Pontos por reserva concluída', NEW.id);
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();

-- Grant usage to the authenticated role
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text) TO authenticated;
