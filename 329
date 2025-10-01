-- This script replaces the seeding function with a truly idempotent version.
-- It will clean up all existing gamification data for the arena and re-seed it correctly.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up ALL existing data for this arena to prevent duplicates, regardless of partial state.
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_settings WHERE arena_id = p_arena_id;

    -- Now, insert the default data.
    -- Insert default settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1);

    -- Insert default levels
    INSERT INTO public.gamification_levels (id, arena_id, name, points_required, level_rank)
    VALUES
        (uuid_generate_v4(), p_arena_id, 'Bronze', 0, 1),
        (uuid_generate_v4(), p_arena_id, 'Prata', 500, 2),
        (uuid_generate_v4(), p_arena_id, 'Ouro', 1500, 3),
        (uuid_generate_v4(), p_arena_id, 'Platina', 3000, 4),
        (uuid_generate_v4(), p_arena_id, 'Lenda', 5000, 5);

    -- Insert default rewards
    INSERT INTO public.gamification_rewards (id, arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (uuid_generate_v4(), p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', null, null, true),
        (uuid_generate_v4(), p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, null, true),
        (uuid_generate_v4(), p_arena_id, 'Equipamento Grátis', 'Aluguel gratuito de equipamentos por 1 dia', 50, 'free_item', null, 100, true);

    -- Insert default achievements
    INSERT INTO public.gamification_achievements (id, arena_id, name, description, type, points_reward, icon)
    VALUES
        (uuid_generate_v4(), p_arena_id, 'Primeira Reserva', 'Por fazer a primeira reserva na plataforma', 'first_reservation', 20, 'Star'),
        (uuid_generate_v4(), p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena', 'play_all_courts', 100, 'Crown'),
        (uuid_generate_v4(), p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês', 'weekly_frequency', 50, 'Calendar'),
        (uuid_generate_v4(), p_arena_id, 'Lealdade Nv.1', 'Por completar 10 reservas', 'loyalty_10', 30, 'Heart'),
        (uuid_generate_v4(), p_arena_id, 'Lealdade Nv.2', 'Por completar 50 reservas', 'loyalty_50', 150, 'Heart'),
        (uuid_generate_v4(), p_arena_id, 'Lealdade Nv.3', 'Por completar 100 reservas', 'loyalty_100', 300, 'Heart');
END;
$$;
