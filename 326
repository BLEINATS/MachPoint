-- Final and definitive script to reset the gamification system
-- This script will drop all related objects and recreate them correctly.

-- 1. Drop all dependent objects in the correct order to avoid conflicts
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;
DROP FUNCTION IF EXISTS public.update_aluno_level_on_points_change();
DROP TRIGGER IF EXISTS on_reservation_completion ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion_points();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- 2. Drop the foreign key constraint from 'alunos' table
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_gamification_level_id_fkey;

-- 3. Drop all gamification tables
DROP TABLE IF EXISTS public.aluno_achievements CASCADE;
DROP TABLE IF EXISTS public.gamification_achievements CASCADE;
DROP TABLE IF EXISTS public.gamification_rewards CASCADE;
DROP TABLE IF EXISTS public.gamification_levels CASCADE;
DROP TABLE IF EXISTS public.gamification_settings CASCADE;

-- 4. Drop columns from 'alunos' table
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_points;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_level_id;

-- 5. Recreate all tables with the correct and final structure
CREATE TABLE public.gamification_settings (
    arena_id uuid PRIMARY KEY REFERENCES public.arenas(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT true NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.gamification_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL
);

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

CREATE TABLE public.gamification_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    points_reward integer NOT NULL,
    icon text
);

CREATE TABLE public.aluno_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Add columns back to 'alunos' table with the foreign key
ALTER TABLE public.alunos ADD COLUMN gamification_points integer DEFAULT 0 NOT NULL;
ALTER TABLE public.alunos ADD COLUMN gamification_level_id uuid REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- 7. Recreate the function to seed default data correctly
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Seed settings
    IF NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
        VALUES (p_arena_id, true, 10, 1);
    END IF;

    -- Seed levels
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 500, 2),
        (p_arena_id, 'Ouro', 1500, 3),
        (p_arena_id, 'Platina', 3000, 4);
    END IF;

    -- Seed rewards
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active) VALUES
        (p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', NULL, 10, true),
        (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, 20, true);
    END IF;

    -- Seed achievements
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon) VALUES
        (p_arena_id, 'Primeira Reserva', 'Sua primeira reserva na arena!', 'first_reservation', 20, 'Sparkles'),
        (p_arena_id, 'Lealdade', 'Completou 10 reservas.', 'loyalty_10', 50, 'Heart');
    END IF;
END;
$$;

-- 8. Re-enable RLS and policies
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.gamification_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON public.aluno_achievements FOR SELECT USING (auth.uid() = (SELECT profile_id FROM alunos WHERE id = aluno_id));
CREATE POLICY "Admins can manage their arena's data" ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's data" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's data" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's data" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's data" ON public.aluno_achievements FOR ALL USING (public.is_arena_admin((SELECT arena_id FROM alunos WHERE id = aluno_id)));

-- 9. Recreate triggers
CREATE OR REPLACE FUNCTION public.handle_reservation_completion_points()
RETURNS TRIGGER AS $$
DECLARE
    points_to_award INT;
    aluno_id_to_update uuid;
    settings public.gamification_settings;
BEGIN
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;
    IF NOT FOUND OR settings.is_enabled = false THEN
        RETURN NEW;
    END IF;

    SELECT id INTO aluno_id_to_update FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    IF aluno_id_to_update IS NULL THEN
        RETURN NEW;
    END IF;

    points_to_award := settings.points_per_reservation + (floor(NEW.total_price) * settings.points_per_real);
    UPDATE public.alunos SET gamification_points = gamification_points + points_to_award WHERE id = aluno_id_to_update;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reservation_completed
AFTER UPDATE OF status ON public.reservas
FOR EACH ROW WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion_points();

CREATE OR REPLACE FUNCTION public.update_aluno_level_on_points_change()
RETURNS TRIGGER AS $$
DECLARE
    new_level_id uuid;
BEGIN
    SELECT id INTO new_level_id FROM public.gamification_levels WHERE arena_id = NEW.arena_id AND points_required <= NEW.gamification_points ORDER BY points_required DESC LIMIT 1;
    IF new_level_id IS NOT NULL AND (OLD.gamification_level_id IS NULL OR OLD.gamification_level_id <> new_level_id) THEN
        UPDATE public.alunos SET gamification_level_id = new_level_id WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_points_change_update_level
AFTER UPDATE OF gamification_points ON public.alunos
FOR EACH ROW WHEN (OLD.gamification_points <> NEW.gamification_points)
EXECUTE FUNCTION public.update_aluno_level_on_points_change();
