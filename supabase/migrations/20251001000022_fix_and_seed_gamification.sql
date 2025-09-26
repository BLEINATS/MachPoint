-- Fixes the gamification_levels table and creates a function to seed default data.
-- This script is idempotent and safe to re-run.

-- Step 1: Fix the 'gamification_levels' table structure.
DO $$
BEGIN
    -- If the old 'rank' column exists, rename it to 'level_rank'.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gamification_levels' AND column_name = 'rank'
    ) THEN
        ALTER TABLE public.gamification_levels RENAME COLUMN "rank" TO level_rank;
    END IF;

    -- If 'level_rank' column still doesn't exist, add it.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gamification_levels' AND column_name = 'level_rank'
    ) THEN
        ALTER TABLE public.gamification_levels ADD COLUMN level_rank integer NOT NULL DEFAULT 0;
    END IF;
END;
$$;

-- Step 2: Create a function to seed default gamification data.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Seed General Settings if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
        VALUES (p_arena_id, true, 10, 1);
    END IF;

    -- Seed Levels if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 500, 2),
            (p_arena_id, 'Ouro', 1500, 3),
            (p_arena_id, 'Platina', 3000, 4);
    END IF;

    -- Seed Rewards if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
        VALUES
            (p_arena_id, 'Desconto de R$ 20', 'Use seus pontos para ganhar R$ 20 de desconto em qualquer reserva.', 200, 'discount', 20, null, true),
            (p_arena_id, 'Hora Grátis (Horário Comercial)', 'Troque seus pontos por uma hora de quadra gratuita de Seg a Sex, das 8h às 18h.', 500, 'free_hour', null, 50, true),
            (p_arena_id, 'Aluguel de Raquete Grátis', 'Não tem raquete? Use seus pontos para alugar uma por nossa conta.', 50, 'free_item', null, null, true);
    END IF;

    -- Seed Achievements if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Concedido ao fazer sua primeira reserva na arena.', 15, 'Star'),
            (p_arena_id, 'Fidelidade Bronze', 'Concedido ao completar 10 reservas.', 50, 'Award'),
            (p_arena_id, 'Madrugador', 'Concedido por jogar antes das 8h da manhã.', 20, 'Sunrise'),
            (p_arena_id, 'Coruja', 'Concedido por jogar após as 22h.', 20, 'Moon');
    END IF;
END;
$$;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.seed_gamification_defaults(uuid) TO authenticated;
