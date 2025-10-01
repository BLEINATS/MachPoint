-- Drop dependent objects first to avoid conflicts
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Drop the table to ensure a clean state from any previous failed migrations
DROP TABLE IF EXISTS public.gamification_levels CASCADE;

-- Recreate the table with the correct column name 'level_rank'
CREATE TABLE public.gamification_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    name text NOT NULL,
    points_required integer NOT NULL,
    level_rank integer NOT NULL,
    CONSTRAINT gamification_levels_pkey PRIMARY KEY (id),
    CONSTRAINT gamification_levels_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT gamification_levels_arena_id_level_rank_key UNIQUE (arena_id, level_rank)
);

-- Recreate the seeding function with the correct column name
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Seed Settings if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
        VALUES (p_arena_id, true, 10, 1);
    END IF;

    -- Seed Levels if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Silver', 500, 2),
            (p_arena_id, 'Gold', 1500, 3),
            (p_arena_id, 'Platinum', 5000, 4);
    END IF;

    -- Seed Rewards if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
        VALUES
            (p_arena_id, 'Desconto de R$ 20', 'Use seus pontos para ganhar um desconto de R$20 em qualquer reserva.', 200, 'discount', 20, null, true),
            (p_arena_id, '1 Hora de Quadra Grátis', 'Resgate uma hora de quadra em horários de menor movimento.', 500, 'free_hour', 1, 50, true);
    END IF;

    -- Seed Achievements if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Sparkles'),
            (p_arena_id, 'Fidelidade Bronze', 'Por completar 10 reservas.', 'loyalty_10', 50, 'Medal');
    END IF;
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.seed_gamification_defaults(uuid) TO authenticated;
