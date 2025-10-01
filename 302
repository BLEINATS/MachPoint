-- Drop the old function first to be safe
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Recreate the function with SECURITY DEFINER and the same logic
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This ensures the function has permissions to delete and insert regardless of RLS
AS $$
BEGIN
    -- Clean up existing data for this arena to prevent duplicates
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_settings WHERE arena_id = p_arena_id;

    -- Insert default settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1);

    -- Insert default levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank) VALUES
    (p_arena_id, 'Bronze', 0, 1),
    (p_arena_id, 'Prata', 100, 2),
    (p_arena_id, 'Ouro', 500, 3),
    (p_arena_id, 'Platina', 1000, 4);

    -- Insert default rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active) VALUES
    (p_arena_id, 'Hora Grátis', 'Uma hora grátis de quadra em horário comercial', 200, 'free_hour', null, 10, true),
    (p_arena_id, 'Desconto R$ 50', 'Desconto de R$ 50 em qualquer reserva', 150, 'discount', 50, null, true);

    -- Insert default achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon) VALUES
    (p_arena_id, 'Primeira Reserva', 'Por fazer a primeira reserva', 'first_reservation', 20, 'Star'),
    (p_arena_id, 'Rei da Quadra', 'Por ter jogado em todas as quadras da arena', 'play_all_courts', 50, 'Crown'),
    (p_arena_id, 'Frequência Total', 'Por jogar toda semana durante um mês', 'weekly_frequency', 100, 'CalendarCheck'),
    (p_arena_id, 'Lealdade Bronze', 'Por completar 10 reservas', 'loyalty_10', 30, 'Medal');
END;
$$;
