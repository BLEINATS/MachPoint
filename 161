/*
  # [SECURITY] Fix Function Search Path for handle_reservation_completion

  [This operation secures the `handle_reservation_completion` trigger function by explicitly setting the `search_path`. This prevents potential security vulnerabilities related to search path hijacking, ensuring the function only accesses objects within the 'public' schema as intended.]

  ## Query Description: [This script safely replaces the existing `handle_reservation_completion` function with a more secure version. It first removes the old function and then recreates it with a fixed `search_path`. This change is purely for security and does not alter the function's logic or impact existing data.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Function being modified: `public.handle_reservation_completion()`
  
  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [No Change]
  - Mitigates: Search Path Hijacking vulnerability for this function.
  
  ## Performance Impact:
  - Indexes: [No Change]
  - Triggers: [No Change]
  - Estimated Impact: [Negligible. The function's execution logic remains the same.]
*/

-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recreate the function with a secure search_path
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_settings public.gamification_settings;
  v_aluno_id UUID;
  v_points_to_add INT;
BEGIN
  -- Check if the reservation is being marked as 'realizada'
  IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
    
    -- Find the corresponding aluno profile
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If there's no aluno profile, we can't award points
    IF v_aluno_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get gamification settings for the arena
    SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- If gamification is not enabled, do nothing
    IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
      RETURN NEW;
    END IF;

    -- Calculate points based on settings
    v_points_to_add := 0;
    IF v_settings.points_per_reservation > 0 THEN
      v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
    END IF;
    IF v_settings.points_per_real > 0 AND NEW.total_price > 0 THEN
      v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
    END IF;

    -- Add the points if there are any to add
    IF v_points_to_add > 0 THEN
      PERFORM public.add_gamification_points(
        v_aluno_id,
        v_points_to_add,
        'Reserva concluída',
        NEW.id
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
