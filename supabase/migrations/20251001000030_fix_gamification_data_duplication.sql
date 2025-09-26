-- This function will now be idempotent, preventing duplicate data.
-- It first deletes existing default data for the arena before inserting fresh defaults.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up existing data for the arena to prevent duplicates
    DELETE FROM public.gamification_settings WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;

    -- Insert default settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1);

    -- Insert default levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 500, 2),
        (p_arena_id, 'Ouro', 1500, 3),
        (p_arena_id, 'Platina', 3000, 4),
        (p_arena_id, 'Lenda da Arena', 5000, 5);

    -- Insert default rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (p_arena_id, 'Desconto de R$ 20', 'Use seus pontos para ganhar R$ 20 de desconto em uma reserva.', 200, 'discount', 20, null, true),
        (p_arena_id, '1 Hora Grátis (Dia de Semana)', 'Troque seus pontos por uma hora de quadra gratuita, válida de Seg a Sex.', 500, 'free_hour', 1, 100, true),
        (p_arena_id, 'Aluguel de Raquete Grátis', 'Alugue uma raquete sem custo para sua próxima partida.', 50, 'free_item', null, null, true);

    -- Insert default achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 25, 'Star'),
        (p_arena_id, 'Fidelidade Bronze', 'Complete 10 reservas na arena.', 'loyalty_10', 50, 'Medal'),
        (p_arena_id, 'Fidelidade Prata', 'Complete 50 reservas na arena.', 'loyalty_50', 250, 'Award'),
        (p_arena_id, 'Fidelidade Ouro', 'Complete 100 reservas na arena.', 'loyalty_100', 500, 'Trophy');
END;
$$;
