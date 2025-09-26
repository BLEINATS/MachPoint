-- =================================================================
-- || FIX DEFINITIVO PARA DUPLICAÇÃO DE DADOS DE GAMIFICAÇÃO      ||
-- =================================================================
-- || Este script substitui a função de seeding por uma versão    ||
-- || robusta que primeiro limpa todos os dados existentes para a ||
-- || arena antes de inserir os padrões, garantindo que não haja ||
-- || mais duplicatas.                                            ||
-- =================================================================

-- 1. Remover a função antiga para garantir que estamos usando a nova.
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- 2. Criar a nova função robusta.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpa TODOS os dados de gamificação existentes para esta arena para evitar duplicatas.
    -- Esta é a etapa crucial que estava falhando anteriormente.
    DELETE FROM public.gamification_settings WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_levels WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_rewards WHERE arena_id = p_arena_id;
    DELETE FROM public.gamification_achievements WHERE arena_id = p_arena_id;

    -- Insere as configurações gerais padrão.
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1);

    -- Insere os níveis padrão.
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 100, 2),
        (p_arena_id, 'Ouro', 500, 3),
        (p_arena_id, 'Platina', 1500, 4),
        (p_arena_id, 'Lenda da Arena', 5000, 5);

    -- Insere as recompensas padrão.
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, quantity, is_active)
    VALUES
        (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto em qualquer reserva.', 100, 'discount', 10, null, true),
        (p_arena_id, 'Hora Grátis', 'Troque seus pontos por 1 hora de quadra grátis (horário comercial).', 500, 'free_hour', 1, 10, true),
        (p_arena_id, 'Aluguel de Raquete', 'Resgate uma raquete para sua próxima partida.', 50, 'free_item', 1, null, true);

    -- Insere as conquistas padrão.
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Star'),
        (p_arena_id, 'Fidelidade Bronze', 'Por completar 10 reservas.', 'loyalty_10', 50, 'Award'),
        (p_arena_id, 'Fidelidade Prata', 'Por completar 50 reservas.', 'loyalty_50', 250, 'Medal'),
        (p_arena_id, 'Fidelidade Ouro', 'Por completar 100 reservas.', 'loyalty_100', 1000, 'Gem');
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados.
GRANT EXECUTE ON FUNCTION public.seed_gamification_defaults(uuid) TO authenticated;
