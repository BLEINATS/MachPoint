-- This script provides a definitive fix for the data duplication issue in the gamification module.
-- It performs a one-time cleanup of all existing gamification data for the current user's arena
-- and replaces the seeding function with a safe, idempotent version that prevents future duplicates.

-- Step 1: Clean all existing gamification data for the current user's arena.
DO $$
DECLARE
    v_arena_id uuid;
BEGIN
    -- Find the arena_id for the current admin user
    SELECT id INTO v_arena_id FROM public.arenas WHERE owner_id = auth.uid() LIMIT 1;

    IF v_arena_id IS NOT NULL THEN
        -- Delete data in an order that respects foreign keys
        DELETE FROM public.aluno_achievements WHERE achievement_id IN (SELECT id FROM public.gamification_achievements WHERE arena_id = v_arena_id);
        UPDATE public.alunos SET gamification_level_id = NULL WHERE arena_id = v_arena_id;

        -- Now delete the gamification data
        DELETE FROM public.gamification_achievements WHERE arena_id = v_arena_id;
        DELETE FROM public.gamification_rewards WHERE arena_id = v_arena_id;
        DELETE FROM public.gamification_levels WHERE arena_id = v_arena_id;
        DELETE FROM public.gamification_settings WHERE arena_id = v_arena_id;
    END IF;
END;
$$;

-- Step 2: Replace the seeding function with a safer version that checks for existence before inserting.
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- This function now checks if data already exists before inserting,
    -- making it safe to call multiple times without creating duplicates.

    -- Insert default settings if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
        VALUES (p_arena_id, true, 10, 1);
    END IF;

    -- Insert default levels if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 100, 2),
            (p_arena_id, 'Ouro', 500, 3),
            (p_arena_id, 'Platina', 1000, 4);
    END IF;

    -- Insert default rewards if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
        VALUES
            (p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', null, 10, true),
            (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, null, true);
    END IF;

    -- Insert default achievements if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Por fazer a primeira reserva', 'first_reservation', 10, 'Star'),
            (p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena', 'play_all_courts', 50, 'Crown'),
            (p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês', 'weekly_frequency', 30, 'CalendarCheck'),
            (p_arena_id, 'Lealdade Nível 1', 'Por completar 10 reservas', 'loyalty_10', 20, 'Heart');
    END IF;
END;
$$;
