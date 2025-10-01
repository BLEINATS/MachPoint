-- Drop existing gamification objects to ensure a clean slate
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);
DROP TABLE IF EXISTS public.aluno_achievements CASCADE;
DROP TABLE IF EXISTS public.gamification_achievements CASCADE;
DROP TABLE IF EXISTS public.gamification_rewards CASCADE;
DROP TABLE IF EXISTS public.gamification_levels CASCADE;
DROP TABLE IF EXISTS public.gamification_settings CASCADE;

-- Recreate all tables with the correct schema

-- 1. Gamification Settings
CREATE TABLE public.gamification_settings (
    arena_id uuid NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real integer DEFAULT 1 NOT NULL,
    CONSTRAINT gamification_settings_pkey PRIMARY KEY (arena_id),
    CONSTRAINT gamification_settings_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- 2. Gamification Levels
CREATE TABLE public.gamification_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL,
    CONSTRAINT gamification_levels_pkey PRIMARY KEY (id),
    CONSTRAINT gamification_levels_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;

-- 3. Gamification Rewards
CREATE TABLE public.gamification_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL,
    value numeric,
    quantity integer,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT gamification_rewards_pkey PRIMARY KEY (id),
    CONSTRAINT gamification_rewards_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;

-- 4. Gamification Achievements
CREATE TABLE public.gamification_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    icon text,
    CONSTRAINT gamification_achievements_pkey PRIMARY KEY (id),
    CONSTRAINT gamification_achievements_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;

-- 5. Aluno Achievements (Join Table)
CREATE TABLE public.aluno_achievements (
    aluno_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT aluno_achievements_pkey PRIMARY KEY (aluno_id, achievement_id),
    CONSTRAINT aluno_achievements_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    CONSTRAINT aluno_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES gamification_achievements(id) ON DELETE CASCADE
);
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON public.gamification_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_achievements.aluno_id AND alunos.profile_id = auth.uid()));

CREATE POLICY "Arena admins can manage their own gamification data" ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Arena admins can manage their own gamification data" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Arena admins can manage their own gamification data" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Arena admins can manage their own gamification data" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));
CREATE POLICY "Arena admins can view all achievements for their arena" ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_achievements.aluno_id AND public.is_arena_admin(alunos.arena_id)));


-- Recreate the seeding function
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
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Silver', 100, 2),
        (p_arena_id, 'Gold', 500, 3),
        (p_arena_id, 'Platinum', 1000, 4)
    ON CONFLICT DO NOTHING;

    -- Seed rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (p_arena_id, 'Desconto de R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto em uma reserva.', 100, 'discount', 10, null, true),
        (p_arena_id, 'Hora Grátis (Horário Comercial)', 'Troque seus pontos por uma hora de quadra gratuita durante o horário comercial.', 500, 'free_hour', null, 10, true)
    ON CONFLICT DO NOTHING;

    -- Seed achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
        (p_arena_id, 'Fidelidade Bronze', 'Por completar 10 reservas.', 'loyalty_10', 50, 'Award')
    ON CONFLICT DO NOTHING;
END;
$$;
