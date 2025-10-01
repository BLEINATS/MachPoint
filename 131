-- Create gamification_settings table
CREATE TABLE IF NOT EXISTS public.gamification_settings (
    arena_id uuid PRIMARY KEY NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    points_per_booking integer DEFAULT 10 NOT NULL,
    points_per_real numeric(10, 2) DEFAULT 1.00 NOT NULL,
    CONSTRAINT gamification_settings_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arena admins can manage their own gamification settings." ON public.gamification_settings;
CREATE POLICY "Arena admins can manage their own gamification settings." ON public.gamification_settings FOR ALL USING (public.is_arena_admin(arena_id));

-- Create gamification_levels table
CREATE TABLE IF NOT EXISTS public.gamification_levels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    level_number integer NOT NULL,
    name text NOT NULL,
    points_required integer NOT NULL,
    CONSTRAINT gamification_levels_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT unique_level_per_arena UNIQUE (arena_id, level_number)
);
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arena admins can manage their own levels." ON public.gamification_levels;
CREATE POLICY "Arena admins can manage their own levels." ON public.gamification_levels FOR ALL USING (public.is_arena_admin(arena_id));
DROP POLICY IF EXISTS "Users can view levels for any arena." ON public.gamification_levels;
CREATE POLICY "Users can view levels for any arena." ON public.gamification_levels FOR SELECT USING (true);


-- Create gamification_rewards table
CREATE TABLE IF NOT EXISTS public.gamification_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    cost_in_points integer NOT NULL,
    type text NOT NULL, -- e.g., 'discount_value', 'discount_percent', 'free_hour', 'free_item'
    value numeric, -- R$50 for discount, 1 for free hour, etc.
    is_active boolean DEFAULT true NOT NULL,
    quantity_available integer,
    CONSTRAINT gamification_rewards_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE
);
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arena admins can manage their own rewards." ON public.gamification_rewards;
CREATE POLICY "Arena admins can manage their own rewards." ON public.gamification_rewards FOR ALL USING (public.is_arena_admin(arena_id));
DROP POLICY IF EXISTS "Users can view rewards for any arena." ON public.gamification_rewards;
CREATE POLICY "Users can view rewards for any arena." ON public.gamification_rewards FOR SELECT USING (true);

-- Create gamification_achievements table (for Badges)
CREATE TABLE IF NOT EXISTS public.gamification_achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    arena_id uuid NOT NULL,
    code text NOT NULL, 
    name text NOT NULL,
    description text,
    points_reward integer DEFAULT 0 NOT NULL,
    icon_name text, 
    CONSTRAINT gamification_achievements_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT unique_achievement_code_per_arena UNIQUE (arena_id, code)
);
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arena admins can manage their own achievements." ON public.gamification_achievements;
CREATE POLICY "Arena admins can manage their own achievements." ON public.gamification_achievements FOR ALL USING (public.is_arena_admin(arena_id));
DROP POLICY IF EXISTS "Users can view achievements for any arena." ON public.gamification_achievements;
CREATE POLICY "Users can view achievements for any arena." ON public.gamification_achievements FOR SELECT USING (true);

-- Create aluno_achievements join table
CREATE TABLE IF NOT EXISTS public.aluno_achievements (
    aluno_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (aluno_id, achievement_id),
    CONSTRAINT aluno_achievements_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    CONSTRAINT aluno_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES gamification_achievements(id) ON DELETE CASCADE
);
ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own achievements." ON public.aluno_achievements;
CREATE POLICY "Users can view their own achievements." ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_id AND alunos.profile_id = auth.uid()));
DROP POLICY IF EXISTS "Arena admins can view achievements of their alunos." ON public.aluno_achievements;
CREATE POLICY "Arena admins can view achievements of their alunos." ON public.aluno_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM alunos WHERE alunos.id = aluno_id AND public.is_arena_admin(alunos.arena_id)));

-- Add columns to alunos table
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS gamification_points integer DEFAULT 0 NOT NULL;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS gamification_level_id uuid;
-- Drop constraint if it exists before adding
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS fk_gamification_level;
ALTER TABLE public.alunos ADD CONSTRAINT fk_gamification_level FOREIGN KEY (gamification_level_id) REFERENCES public.gamification_levels(id) ON DELETE SET NULL;

-- Function to handle points and achievements on new booking
CREATE OR REPLACE FUNCTION public.handle_booking_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings public.gamification_settings;
    target_aluno public.alunos;
    points_to_add integer := 0;
    first_booking_achievement_id uuid;
BEGIN
    SELECT * INTO settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;
    IF settings IS NULL OR settings.is_active = false THEN
        RETURN NEW;
    END IF;

    SELECT * INTO target_aluno FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    IF target_aluno IS NULL THEN
        RETURN NEW;
    END IF;

    points_to_add := settings.points_per_booking;
    IF NEW.total_price IS NOT NULL AND NEW.total_price > 0 THEN
        points_to_add := points_to_add + floor(NEW.total_price * settings.points_per_real);
    END IF;

    SELECT id INTO first_booking_achievement_id FROM public.gamification_achievements WHERE arena_id = NEW.arena_id AND code = 'FIRST_BOOKING';
    IF first_booking_achievement_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.aluno_achievements WHERE aluno_id = target_aluno.id AND achievement_id = first_booking_achievement_id) THEN
            IF (SELECT count(*) FROM public.reservas WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id AND status = 'confirmada') <= 1 THEN
                INSERT INTO public.aluno_achievements (aluno_id, achievement_id) VALUES (target_aluno.id, first_booking_achievement_id);
                points_to_add := points_to_add + (SELECT points_reward FROM public.gamification_achievements WHERE id = first_booking_achievement_id);
            END IF;
        END IF;
    END IF;

    UPDATE public.alunos
    SET gamification_points = gamification_points + points_to_add
    WHERE id = target_aluno.id;

    RETURN NEW;
END;
$$;

-- Trigger on new reservation
DROP TRIGGER IF EXISTS on_new_booking_gamification ON public.reservas;
CREATE TRIGGER on_new_booking_gamification
AFTER INSERT ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'confirmada')
EXECUTE FUNCTION public.handle_booking_gamification();

-- Function to update user level based on points
CREATE OR REPLACE FUNCTION public.update_aluno_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_level_id uuid;
BEGIN
    SELECT id INTO new_level_id
    FROM public.gamification_levels
    WHERE arena_id = NEW.arena_id AND points_required <= NEW.gamification_points
    ORDER BY points_required DESC
    LIMIT 1;

    IF NEW.gamification_level_id IS DISTINCT FROM new_level_id THEN
        UPDATE public.alunos
        SET gamification_level_id = new_level_id
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to update level when points change
DROP TRIGGER IF EXISTS on_points_change_update_level ON public.alunos;
CREATE TRIGGER on_points_change_update_level
AFTER UPDATE OF gamification_points ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_aluno_level();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_booking_gamification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_aluno_level() TO authenticated;
