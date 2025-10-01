-- Function to seed default gamification data for an arena, now with cleanup to prevent duplicates.
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- STEP 1: Clean up existing data for this arena to prevent duplicates
    DELETE FROM public.gamification_settings WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;

    -- STEP 2: Insert default settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1);

    -- STEP 3: Insert default levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank, icon)
    VALUES
        (p_arena_id, 'Bronze', 0, 1, 'Shield'),
        (p_arena_id, 'Prata', 100, 2, 'Shield'),
        (p_arena_id, 'Ouro', 500, 3, 'Shield'),
        (p_arena_id, 'Platina', 1500, 4, 'Shield'),
        (p_arena_id, 'Lenda', 5000, 5, 'Crown');

    -- STEP 4: Insert default rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', 1, 10, true),
        (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, null, true),
        (p_arena_id, 'Equipamento Grátis', 'Aluguel gratuito de equipamentos por 1 dia', 50, 'free_item', 1, 50, true);

    -- STEP 5: Insert default achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Por fazer a primeira reserva na plataforma', 20, 'first_reservation', 'Star'),
        (p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena', 100, 'play_all_courts', 'Map'),
        (p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês', 50, 'weekly_frequency', 'Calendar'),
        (p_arena_id, 'Lealdade Nível 1', 'Por completar 10 reservas', 30, 'loyalty_10', 'Heart'),
        (p_arena_id, 'Lealdade Nível 2', 'Por completar 50 reservas', 150, 'loyalty_50', 'Gem'),
        (p_arena_id, 'Lealdade Nível 3', 'Por completar 100 reservas', 500, 'loyalty_100', 'Crown');
END;
$$;
