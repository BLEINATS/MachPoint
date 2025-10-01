-- This script will completely reset the gamification system to a clean, working state.
-- It's designed to be run safely, even if previous migrations partially failed.
-- Step 1: Drop dependent objects (triggers, constraints) in the correct order.
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;
ALTER TABLE IF EXISTS public.aluno_achievements DROP CONSTRAINT IF EXISTS aluno_achievements_achievement_id_fkey;
ALTER TABLE IF EXISTS public.aluno_achievements DROP CONSTRAINT IF EXISTS aluno_achievements_aluno_id_fkey;
ALTER TABLE IF EXISTS public.alunos DROP CONSTRAINT IF EXISTS alunos_gamification_level_id_fkey;

-- Step 2: Drop all gamification-related functions.
DROP FUNCTION IF EXISTS public.handle_reservation_completion();
DROP FUNCTION IF EXISTS public.update_aluno_level();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Step 3: Drop all gamification-related tables.
DROP TABLE IF EXISTS public.aluno_achievements;
DROP TABLE IF EXISTS public.gamification_achievements;
DROP TABLE IF EXISTS public.gamification_rewards;
DROP TABLE IF EXISTS public.gamification_levels;
DROP TABLE IF EXISTS public.gamification_settings;

-- Step 4: Drop columns from 'alunos' table.
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_points;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_level_id;

-- Step 5: Recreate all tables and columns with the correct structure.
-- Re-add columns to 'alunos'
ALTER TABLE public.alunos ADD COLUMN gamification_points integer DEFAULT 0;
ALTER TABLE public.alunos ADD COLUMN gamification_level_id uuid;

-- Re-create gamification tables
CREATE TABLE public.gamification_settings (
    arena_id uuid NOT NULL PRIMARY KEY REFERENCES public.arenas(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.gamification_levels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL
);

CREATE TABLE public.gamification_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL, -- 'discount', 'free_hour', 'free_item'
    value numeric,
    quantity integer,
    is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.gamification_achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL, -- 'first_reservation', 'play_all_courts', etc.
    points_reward integer DEFAULT 0 NOT NULL,
    icon text
);

CREATE TABLE public.aluno_achievements (
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (aluno_id, achievement_id)
);

-- Re-add foreign key to 'alunos'
ALTER TABLE public.alunos ADD CONSTRAINT alunos_gamification_level_id_fkey FOREIGN KEY (gamification_level_id) REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- Step 6: Re-enable RLS on all new tables.
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies.
CREATE POLICY "Enable read access for all users" ON public.gamification_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_achievements.aluno_id AND alunos.profile_id = auth.uid()));
CREATE POLICY "Admins can manage their arena's gamification" ON public.gamification_settings FOR ALL USING (is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's gamification" ON public.gamification_levels FOR ALL USING (is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's gamification" ON public.gamification_rewards FOR ALL USING (is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's gamification" ON public.gamification_achievements FOR ALL USING (is_arena_admin(arena_id));
CREATE POLICY "Admins can manage their arena's achievements" ON public.aluno_achievements FOR ALL USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_achievements.aluno_id AND is_arena_admin(alunos.arena_id)));

-- Step 8: Recreate functions and triggers.
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_settings public.gamification_settings;
    v_points_to_add INT;
BEGIN
    SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;
    IF v_settings IS NOT NULL AND v_settings.is_enabled THEN
        v_points_to_add := v_settings.points_per_reservation + (NEW.total_price * v_settings.points_per_real);
        UPDATE public.alunos
        SET gamification_points = COALESCE(gamification_points, 0) + v_points_to_add
        WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_aluno_level()
RETURNS TRIGGER AS $$
DECLARE
    v_new_level_id UUID;
BEGIN
    SELECT id INTO v_new_level_id
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id AND points_required <= NEW.gamification_points
    ORDER BY points_required DESC
    LIMIT 1;
    
    IF v_new_level_id IS NOT NULL AND NEW.gamification_level_id IS DISTINCT FROM v_new_level_id THEN
        NEW.gamification_level_id := v_new_level_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This function will seed the database with default gamification data if it doesn't exist.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void AS $$
BEGIN
    -- Seed settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES
    (p_arena_id, 'Bronze', 0, 1),
    (p_arena_id, 'Prata', 500, 2),
    (p_arena_id, 'Ouro', 1500, 3),
    (p_arena_id, 'Platina', 3000, 4),
    (p_arena_id, 'Lenda', 5000, 5)
    ON CONFLICT DO NOTHING;

    -- Seed rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active) VALUES
    (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10, null, true),
    (p_arena_id, 'Aluguel de Raquete', 'Alugue uma raquete de Beach Tennis ou Padel por nossa conta.', 150, 'free_item', 1, null, true),
    (p_arena_id, 'Tubo de Bolas Grátis', 'Leve um tubo de bolas novas para o seu jogo.', 200, 'free_item', 2, null, true),
    (p_arena_id, 'Desconto R$ 50', 'Um super desconto de R$ 50 para sua próxima reserva.', 450, 'discount', 50, 50, true),
    (p_arena_id, 'Hora Grátis', 'Uma hora de quadra gratuita em horário comercial (8h-18h).', 800, 'free_hour', 1, 20, true)
    ON CONFLICT DO NOTHING;

    -- Seed achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon) VALUES
    (p_arena_id, 'Primeira Reserva', 'Fez sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
    (p_arena_id, 'Frequência Semanal', 'Jogou pelo menos uma vez por semana durante um mês.', 'weekly_frequency', 50, 'Calendar'),
    (p_arena_id, 'Lealdade', 'Completou 10 reservas na arena.', 'loyalty_10', 100, 'Heart')
    ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();

CREATE TRIGGER on_points_change_update_level
BEFORE UPDATE OF gamification_points ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_level();

GRANT EXECUTE ON FUNCTION public.seed_gamification_defaults(uuid) TO authenticated;
