-- Full Gamification System Reset and Re-creation
-- This script is idempotent and can be run safely.

-- STEP 1: Drop dependent objects first (triggers, functions)
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_points_change_update_level();
DROP FUNCTION IF EXISTS public.handle_reservation_completion();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- STEP 2: Drop all gamification tables
DROP TABLE IF EXISTS public.aluno_achievements;
DROP TABLE IF EXISTS public.gamification_achievements;
DROP TABLE IF EXISTS public.gamification_rewards;
DROP TABLE IF EXISTS public.gamification_levels;
DROP TABLE IF EXISTS public.gamification_settings;

-- STEP 3: Drop columns from 'alunos' table
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='alunos' AND column_name='gamification_points') THEN
      ALTER TABLE public.alunos DROP COLUMN gamification_points;
   END IF;
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='alunos' AND column_name='gamification_level_id') THEN
      ALTER TABLE public.alunos DROP COLUMN gamification_level_id;
   END IF;
END $$;


-- STEP 4: Re-create everything from scratch

-- Table for general settings
CREATE TABLE public.gamification_settings (
    arena_id uuid PRIMARY KEY REFERENCES public.arenas(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real numeric DEFAULT 1 NOT NULL
);

-- Table for levels
CREATE TABLE public.gamification_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL,
    CONSTRAINT unique_level_rank_per_arena UNIQUE (arena_id, level_rank)
);

-- Table for rewards
CREATE TABLE public.gamification_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL,
    value numeric,
    quantity integer,
    is_active boolean DEFAULT true NOT NULL
);

-- Table for achievements/badges
CREATE TABLE public.gamification_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    icon text
);

-- Join table for unlocked achievements
CREATE TABLE public.aluno_achievements (
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (aluno_id, achievement_id)
);

-- Add columns back to 'alunos' table
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS gamification_points integer DEFAULT 0 NOT NULL;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS gamification_level_id uuid REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- Function to seed default data
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1) ON CONFLICT (arena_id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 500, 2),
            (p_arena_id, 'Ouro', 1500, 3),
            (p_arena_id, 'Platina', 5000, 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value)
        VALUES
            (p_arena_id, 'Desconto de R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto em uma reserva.', 100, 'discount', 10),
            (p_arena_id, 'Hora Grátis (Horário Comercial)', 'Troque seus pontos por 1h de quadra em horário de baixo movimento.', 500, 'free_hour', null);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
            (p_arena_id, 'Fidelidade Bronze', 'Por completar 10 reservas.', 'loyalty_10', 50, 'Award');
    END IF;
END;
$$;

-- Function to handle level update
CREATE OR REPLACE FUNCTION public.handle_points_change_update_level()
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

-- Trigger to update level
CREATE TRIGGER on_points_change_update_level
BEFORE UPDATE OF gamification_points ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.handle_points_change_update_level();

-- Function to add points
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    settings public.gamification_settings;
    aluno_profile_id uuid;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status <> 'confirmada' AND NEW.status = 'confirmada' THEN
        SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;
        IF settings IS NULL OR NOT settings.is_enabled THEN RETURN NEW; END IF;
        
        IF NEW.profile_id IS NOT NULL THEN
            UPDATE public.alunos
            SET gamification_points = gamification_points + settings.points_per_reservation + (NEW.total_price * settings.points_per_real)
            WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to add points
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_completion();

-- Enable RLS and set policies
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gamification" ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read gamification" ON public.gamification_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage levels" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read levels" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read rewards" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read achievements" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Users can see their own achievements" ON public.aluno_achievements FOR SELECT USING (auth.uid() = (SELECT profile_id FROM public.alunos WHERE id = aluno_id));
CREATE POLICY "Admins can see all achievements" ON public.aluno_achievements FOR SELECT USING (public.is_arena_admin((SELECT arena_id FROM public.alunos WHERE id = aluno_id)));
