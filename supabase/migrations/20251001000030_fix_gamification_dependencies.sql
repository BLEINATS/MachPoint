-- Comprehensive Fix for Gamification System
-- This script safely drops all related objects in the correct order and recreates them.

-- 1. Drop dependent triggers first
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;

-- 2. Drop functions that were used by triggers
DROP FUNCTION IF EXISTS public.handle_reservation_completion();
DROP FUNCTION IF EXISTS public.update_aluno_level();
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- 3. Drop foreign key constraints before dropping tables
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_gamification_level_id_fkey;

-- 4. Drop gamification tables
DROP TABLE IF EXISTS public.gamification_aluno_achievements;
DROP TABLE IF EXISTS public.gamification_rewards;
DROP TABLE IF EXISTS public.gamification_achievements;
DROP TABLE IF EXISTS public.gamification_levels;
DROP TABLE IF EXISTS public.gamification_settings;

-- 5. Drop columns from 'alunos' table
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_level_id;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS gamification_points;

-- =================================================================
-- RECREATE EVERYTHING FROM SCRATCH
-- =================================================================

-- 6. Recreate gamification tables with correct structure
CREATE TABLE public.gamification_settings (
    arena_id uuid PRIMARY KEY NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    points_per_reservation integer DEFAULT 10 NOT NULL,
    points_per_real numeric DEFAULT 1 NOT NULL,
    CONSTRAINT gamification_settings_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);

CREATE TABLE public.gamification_levels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL,
    CONSTRAINT gamification_levels_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);

CREATE TABLE public.gamification_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    type text NOT NULL,
    value numeric,
    quantity integer,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT gamification_rewards_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);

CREATE TABLE public.gamification_achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    icon text,
    CONSTRAINT gamification_achievements_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);

CREATE TABLE public.gamification_aluno_achievements (
    aluno_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gamification_aluno_achievements_pkey PRIMARY KEY (aluno_id, achievement_id),
    CONSTRAINT gamification_aluno_achievements_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    CONSTRAINT gamification_aluno_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES gamification_achievements(id) ON DELETE CASCADE
);

-- 7. Re-add columns to 'alunos' and the foreign key
ALTER TABLE public.alunos ADD COLUMN gamification_points integer DEFAULT 0;
ALTER TABLE public.alunos ADD COLUMN gamification_level_id uuid;
ALTER TABLE public.alunos ADD CONSTRAINT alunos_gamification_level_id_fkey FOREIGN KEY (gamification_level_id) REFERENCES gamification_levels(id) ON DELETE SET NULL;

-- 8. Re-enable RLS and add policies
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for admin" ON public.gamification_settings FOR SELECT USING (public.is_arena_admin(arena_id));
CREATE POLICY "Enable update for admin" ON public.gamification_settings FOR UPDATE USING (public.is_arena_admin(arena_id));

ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all" ON public.gamification_levels FOR SELECT USING (true);
CREATE POLICY "Enable all for admin" ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));

ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all" ON public.gamification_rewards FOR SELECT USING (true);
CREATE POLICY "Enable all for admin" ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));

ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all" ON public.gamification_achievements FOR SELECT USING (true);
CREATE POLICY "Enable all for admin" ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));

ALTER TABLE public.gamification_aluno_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.gamification_aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = gamification_aluno_achievements.aluno_id AND alunos.profile_id = auth.uid()));
CREATE POLICY "Admin can view all" ON public.gamification_aluno_achievements FOR SELECT USING (public.is_arena_admin((SELECT arena_id FROM alunos WHERE alunos.id = gamification_aluno_achievements.aluno_id)));


-- 9. Recreate the seeding function
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Seed settings if not exist
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed levels if not exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 100, 2),
        (p_arena_id, 'Ouro', 500, 3),
        (p_arena_id, 'Platina', 1000, 4);
    END IF;

    -- Seed rewards if not exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active) VALUES
        (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto em uma reserva.', 100, 'discount', 10, null, true),
        (p_arena_id, 'Aluguel de Raquete Grátis', 'Resgate uma raquete para sua próxima partida.', 50, 'free_item', 1, null, true);
    END IF;

    -- Seed achievements if not exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon) VALUES
        (p_arena_id, 'Primeira Reserva', 'Sua jornada começa aqui!', 'first_reservation', 20, 'Star'),
        (p_arena_id, 'Fidelidade', 'Complete 10 reservas.', 'loyalty_10', 50, 'Heart');
    END IF;
END;
$$;

-- 10. Recreate function to add points
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    settings public.gamification_settings;
    aluno_id_to_update uuid;
    points_to_add integer;
BEGIN
    -- Find the settings for the arena
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- If gamification is disabled, do nothing
    IF settings IS NULL OR NOT settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Find the 'aluno' record from the 'profile_id' on the reservation
    SELECT id INTO aluno_id_to_update FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;

    -- If no 'aluno' found, do nothing
    IF aluno_id_to_update IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate points
    points_to_add := settings.points_per_reservation + floor(NEW.total_price * settings.points_per_real);

    -- Update aluno's points
    UPDATE public.alunos
    SET gamification_points = coalesce(gamification_points, 0) + points_to_add
    WHERE id = aluno_id_to_update;

    RETURN NEW;
END;
$$;

-- 11. Recreate trigger to award points
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();

-- 12. Recreate function and trigger to update level
CREATE OR REPLACE FUNCTION public.update_aluno_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    new_level_id uuid;
BEGIN
    SELECT id INTO new_level_id
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id AND points_required <= NEW.gamification_points
    ORDER BY level_rank DESC
    LIMIT 1;

    NEW.gamification_level_id := new_level_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_points_change_update_level
BEFORE UPDATE OF gamification_points ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_level();
