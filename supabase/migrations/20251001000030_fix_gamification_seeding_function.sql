-- This script replaces the seeding function with an idempotent version that cleans up duplicates before inserting.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpa dados de gamificação existentes para esta arena para evitar duplicatas
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;

    -- Seed settings (UPSERT é naturalmente idempotente)
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        points_per_reservation = EXCLUDED.points_per_reservation,
        points_per_real = EXCLUDED.points_per_real;

    -- Seed levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 500, 2),
        (p_arena_id, 'Ouro', 1500, 3),
        (p_arena_id, 'Platina', 3000, 4),
        (p_arena_id, 'Lenda da Arena', 5000, 5);

    -- Seed rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (p_arena_id, 'Hora Grátis (Comercial)', 'Uma hora de quadra grátis em horário comercial.', 200, 'free_hour', 1, null, true),
        (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva.', 150, 'discount', 50, null, true),
        (p_arena_id, 'Equipamento Grátis', 'Aluguel de equipamento grátis por 1 dia.', 50, 'free_item', 1, null, true);

    -- Seed achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
        (p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena.', 'play_all_courts', 100, 'Crown'),
        (p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês.', 'weekly_frequency', 50, 'Calendar'),
        (p_arena_id, 'Lealdade Bronze', 'Por completar 10 reservas.', 'loyalty_10', 30, 'Medal'),
        (p_arena_id, 'Lealdade Prata', 'Por completar 50 reservas.', 'loyalty_50', 150, 'Medal'),
        (p_arena_id, 'Lealdade Ouro', 'Por completar 100 reservas.', 'loyalty_100', 300, 'Medal');
END;
$$;
