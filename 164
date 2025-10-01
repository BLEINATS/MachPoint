/*
  ## Description
  This migration continues to improve database security by setting a fixed `search_path` for several trigger functions.
  This is a preventative measure against potential security vulnerabilities, as recommended by Supabase security advisories.
  It does not change the functionality of the application.
*/

-- Secure the trigger function that handles reservation completion and gamification points
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings gamification_settings;
  v_points_to_add int;
  v_aluno_id uuid;
BEGIN
  -- Only run on update when status changes to 'realizada'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'realizada' AND OLD.status <> 'realizada') THEN
    -- Find the corresponding aluno_id from the profile_id
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- Only proceed if there is a student profile and a reservation price
    IF v_aluno_id IS NOT NULL AND NEW.total_price IS NOT NULL AND NEW.total_price > 0 THEN
      -- Get gamification settings for the arena
      SELECT * INTO v_settings
      FROM public.gamification_settings
      WHERE arena_id = NEW.arena_id AND is_enabled = true;

      -- If gamification is enabled for the arena
      IF FOUND THEN
        v_points_to_add := 0;
        
        -- Add points per reservation
        IF v_settings.points_per_reservation > 0 THEN
          v_points_to_add := v_points_to_add + v_settings.points_per_reservation;
        END IF;

        -- Add points per real spent
        IF v_settings.points_per_real > 0 THEN
          v_points_to_add := v_points_to_add + floor(NEW.total_price * v_settings.points_per_real);
        END IF;

        -- If there are points to add, call the function
        IF v_points_to_add > 0 THEN
          PERFORM add_gamification_points(
            v_aluno_id,
            v_points_to_add,
            'Pontos por reserva concluída'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Secure the trigger function that handles new reservation notifications
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quadra_name text;
BEGIN
    -- Notify the arena admin when a new reservation is created
    IF (TG_OP = 'INSERT') THEN
        SELECT name INTO v_quadra_name FROM public.quadras WHERE id = NEW.quadra_id;

        INSERT INTO public.notificacoes (arena_id, message, type, link_to)
        VALUES (
            NEW.arena_id,
            'Nova reserva de ' || COALESCE(NEW.clientName, 'Cliente') || ' na quadra ' || COALESCE(v_quadra_name, 'N/A'),
            'nova_reserva',
            '/reservas'
        );
    END IF;

    RETURN NEW;
END;
$$;
