-- Definitive Gamification Schema Reset and Seed
-- This script will completely remove and rebuild the gamification system.

-- 1. Drop all dependent objects in the correct order
DROP TRIGGER IF EXISTS on_reservation_completed_award_points ON public.reservas;
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;

DROP FUNCTION IF EXISTS public.handle_reservation_completion();
DROP FUNCTION IF EXISTS public.update_aluno_level();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Drop the foreign key constraint from 'alunos' before dropping the 'gamification_levels' table
ALTER TABLE IF EXISTS public.alunos DROP CONSTRAINT IF EXISTS alunos_gamification_level_id_fkey;

-- 2. Drop all gamification tables
DROP TABLE IF EXISTS public.aluno_achievements;
DROP TABLE IF EXISTS public.gamification_achievements;
DROP TABLE IF EXISTS public.gamification_rewards;
DROP TABLE IF EXISTS public.gamification_levels;
DROP TABLE IF EXISTS public.gamification_settings;

-- 3. Drop columns from 'alunos' table
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_points;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_level_id;

-- 4. Recreate all gamification tables with the correct structure and security
-- Settings Table
CREATE TABLE public.gamification_settings (
    arena_id uuid PRIMARY KEY REFERENCES public.arenas(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real numeric DEFAULT 1 NOT NULL
);
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage gamification settings" ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id)) WITH CHECK (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read gamification settings" ON public.gamification_settings FOR SELECT USING (true);


-- Levels Table
CREATE TABLE public.gamification_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL,
    UNIQUE (arena_id, level_rank)
);
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage gamification levels" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id)) WITH CHECK (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read gamification levels" ON public.gamification_levels FOR SELECT USING (true);

-- Rewards Table
CREATE TABLE public.gamification_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL, -- 'discount', 'free_hour', 'free_item'
    value numeric,
    quantity integer,
    is_active boolean DEFAULT true NOT NULL,
    UNIQUE(arena_id, title)
);
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage gamification rewards" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id)) WITH CHECK (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read gamification rewards" ON public.gamification_rewards FOR SELECT USING (true);

-- Achievements Table
CREATE TABLE public.gamification_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL, -- 'first_reservation', 'play_all_courts', etc.
    points_reward integer NOT NULL,
    icon text,
    UNIQUE(arena_id, type)
);
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage gamification achievements" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id)) WITH CHECK (public.is_arena_admin(arena_id));
CREATE POLICY "Users can read gamification achievements" ON public.gamification_achievements FOR SELECT USING (true);


-- Aluno Achievements Junction Table
CREATE TABLE public.aluno_achievements (
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (aluno_id, achievement_id)
);
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM public.alunos WHERE id = aluno_id AND profile_id = auth.uid()));
CREATE POLICY "Admins can view all achievements" ON public.aluno_achievements FOR SELECT USING (public.is_arena_admin((SELECT arena_id FROM public.alunos WHERE id = aluno_id)));

-- 5. Add columns back to alunos table
ALTER TABLE public.alunos ADD COLUMN gamification_points integer DEFAULT 0 NOT NULL;
ALTER TABLE public.alunos ADD COLUMN gamification_level_id uuid REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- 6. Recreate the seeding function with a safer, idempotent approach
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Seed Settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed Levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES (p_arena_id, 'Bronze', 0, 1) ON CONFLICT (arena_id, level_rank) DO NOTHING;
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES (p_arena_id, 'Prata', 500, 2) ON CONFLICT (arena_id, level_rank) DO NOTHING;
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES (p_arena_id, 'Ouro', 1500, 3) ON CONFLICT (arena_id, level_rank) DO NOTHING;
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES (p_arena_id, 'Platina', 4000, 4) ON CONFLICT (arena_id, level_rank) DO NOTHING;

    -- Seed Rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES (p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', null, 10, true)
    ON CONFLICT (arena_id, title) DO NOTHING;
    
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, 20, true)
    ON CONFLICT (arena_id, title) DO NOTHING;
    
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES (p_arena_id, 'Equipamento Grátis', 'Aluguel gratuito de equipamentos por 1 dia', 50, 'free_item', null, 50, true)
    ON CONFLICT (arena_id, title) DO NOTHING;

    -- Seed Achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES (p_arena_id, 'Primeira Reserva', 'Por fazer a primeira reserva na plataforma', 'first_reservation', 25, 'Star')
    ON CONFLICT (arena_id, type) DO NOTHING;
    
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES (p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena', 'play_all_courts', 100, 'Crown')
    ON CONFLICT (arena_id, type) DO NOTHING;
    
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES (p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês', 'weekly_frequency', 50, 'Calendar')
    ON CONFLICT (arena_id, type) DO NOTHING;
    
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES (p_arena_id, 'Lealdade', 'Por completar 10 reservas', 'loyalty_10', 75, 'Heart')
    ON CONFLICT (arena_id, type) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_gamification_defaults(uuid) TO authenticated;

-- 7. Recreate functions and triggers
-- (Functions and triggers will be added in the next step to ensure this transaction commits)
