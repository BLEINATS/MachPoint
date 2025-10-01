-- Final and definitive script to clean and set up the gamification system.

-- STEP 1: Drop all dependent objects in the correct order to ensure a clean slate.
DROP TRIGGER IF EXISTS on_reservation_update_gamification ON public.reservas;
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;
DROP FUNCTION IF EXISTS public.handle_reservation_update_gamification();
DROP FUNCTION IF EXISTS public.update_aluno_level();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Drop foreign key constraint before dropping the table or the column it references.
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_gamification_level_id_fkey;

-- Drop tables.
DROP TABLE IF EXISTS public.aluno_achievements;
DROP TABLE IF EXISTS public.gamification_rewards;
DROP TABLE IF EXISTS public.gamification_achievements;
DROP TABLE IF EXISTS public.gamification_levels;
DROP TABLE IF EXISTS public.gamification_settings;

-- Drop columns from 'alunos' table.
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_points;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_level_id;

-- STEP 2: Add the missing ENUM values to reservation_status.
-- This is the root cause of the previous error.
ALTER TYPE public.reservation_status ADD VALUE IF NOT EXISTS 'realizada';
ALTER TYPE public.reservation_status ADD VALUE IF NOT EXISTS 'concluido';

-- STEP 3: Recreate the entire gamification schema from scratch.

-- Table for general gamification settings per arena
CREATE TABLE public.gamification_settings (
    arena_id uuid PRIMARY KEY NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real numeric DEFAULT 1 NOT NULL
);
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Table for gamification levels (Bronze, Silver, etc.)
CREATE TABLE public.gamification_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL -- Used for ordering levels
);
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;

-- Table for rewards that can be redeemed with points
CREATE TABLE public.gamification_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL, -- 'discount', 'free_hour', 'free_item'
    value numeric, -- For discount amount or item ID
    quantity integer, -- Null for unlimited
    is_active boolean DEFAULT true NOT NULL
);
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;

-- Table for achievements/badges
CREATE TABLE public.gamification_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL, -- e.g., 'first_reservation', 'loyalty_10'
    points_reward integer DEFAULT 0 NOT NULL,
    icon text
);
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;

-- Table to track which achievements a user has unlocked
CREATE TABLE public.aluno_achievements (
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (aluno_id, achievement_id)
);
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;

-- Add columns to 'alunos' table
ALTER TABLE public.alunos ADD COLUMN gamification_points integer DEFAULT 0 NOT NULL;
ALTER TABLE public.alunos ADD COLUMN gamification_level_id uuid REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- Add RLS Policies
CREATE POLICY "Enable read access for all users" ON public.gamification_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Users can see their own achievements" ON public.aluno_achievements FOR SELECT USING (auth.uid() = (SELECT profile_id FROM alunos WHERE id = aluno_id));
CREATE POLICY "Admins can manage their own arena's data" ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their own arena's data" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their own arena's data" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their own arena's data" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their own arena's data" ON public.aluno_achievements FOR ALL USING (public.is_arena_admin((SELECT arena_id FROM alunos WHERE id = aluno_id)));

-- Function to seed default data
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Seed settings
  INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
  VALUES (p_arena_id, true, 10, 1)
  ON CONFLICT (arena_id) DO NOTHING;

  -- Seed levels
  INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES
  (p_arena_id, 'Bronze', 0, 1),
  (p_arena_id, 'Prata', 100, 2),
  (p_arena_id, 'Ouro', 500, 3),
  (p_arena_id, 'Platina', 1000, 4)
  ON CONFLICT DO NOTHING;

  -- Seed rewards
  INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value) VALUES
  (p_arena_id, 'Desconto de R$ 10', 'Use 100 pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10),
  (p_arena_id, 'Hora Grátis', 'Use 500 pontos para uma hora de quadra grátis.', 500, 'free_hour', 1)
  ON CONFLICT DO NOTHING;

  -- Seed achievements
  INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon) VALUES
  (p_arena_id, 'Primeira Reserva', 'Concedido por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
  (p_arena_id, 'Fidelidade Bronze', 'Concedido por completar 10 reservas.', 'loyalty_10', 50, 'Award')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to update a user's level based on points
CREATE OR REPLACE FUNCTION public.update_aluno_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_level_id uuid;
BEGIN
  SELECT id INTO new_level_id
  FROM public.gamification_levels
  WHERE arena_id = NEW.arena_id AND points_required <= NEW.gamification_points
  ORDER BY points_required DESC
  LIMIT 1;

  NEW.gamification_level_id := new_level_id;
  RETURN NEW;
END;
$$;

-- Trigger to update level when points change
CREATE TRIGGER on_points_change_update_level
BEFORE UPDATE OF gamification_points ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_level();

-- Function to handle gamification logic on reservation update
CREATE OR REPLACE FUNCTION public.handle_reservation_update_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  settings public.gamification_settings;
  aluno public.alunos;
BEGIN
  -- Check if the reservation status changed to 'realizada'
  IF NEW.status = 'realizada' AND OLD.status <> 'realizada' THEN
    -- Get gamification settings for the arena
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- If gamification is disabled, do nothing
    IF settings IS NULL OR NOT settings.is_enabled THEN
      RETURN NEW;
    END IF;

    -- Find the corresponding aluno profile
    SELECT * INTO aluno FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no aluno profile, do nothing
    IF aluno IS NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate points
    DECLARE
      points_to_add integer := 0;
    BEGIN
      points_to_add := settings.points_per_reservation + floor(NEW.total_price * settings.points_per_real);
      
      -- Update aluno's points
      UPDATE public.alunos
      SET gamification_points = gamification_points + points_to_add
      WHERE id = aluno.id;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to award points when a reservation is marked as 'realizada'
CREATE TRIGGER on_reservation_update_gamification
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_update_gamification();
