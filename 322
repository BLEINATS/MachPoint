/*
# [Function Security] Set Search Path for seed_gamification_defaults
[This operation enhances the security of the 'seed_gamification_defaults' function by explicitly setting the 'search_path'.]

## Query Description: [This change makes the function more secure by preventing potential hijacking of the function's execution path. It has no impact on existing data or application functionality.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.seed_gamification_defaults(uuid)

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [service_role or postgres user]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir configurações padrão se não existirem
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Inserir níveis padrão se não existirem para esta arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 100, 2),
            (p_arena_id, 'Ouro', 500, 3),
            (p_arena_id, 'Platina', 1000, 4),
            (p_arena_id, 'Diamante', 2000, 5);
    END IF;

    -- Inserir recompensas padrão se não existirem para esta arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
        VALUES
            (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10, true),
            (p_arena_id, 'Desconto R$ 25', 'Um super desconto de R$ 25 para sua próxima reserva.', 220, 'discount', 25, true),
            (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 50, 'free_item', 1, true);
    END IF;

    -- Inserir conquistas padrão se não existirem para esta arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Sua jornada começa aqui!', 'first_reservation', 20, 'Star'),
            (p_arena_id, 'Explorador', 'Jogou em todas as quadras da arena.', 'play_all_courts', 50, 'Map'),
            (p_arena_id, 'Frequência Semanal', 'Jogou pelo menos uma vez por semana no último mês.', 'weekly_frequency', 30, 'Calendar'),
            (p_arena_id, 'Fiel Escudeiro', 'Completou 10 reservas.', 'loyalty_10', 50, 'Heart'),
            (p_arena_id, 'Sócio de Carteirinha', 'Completou 50 reservas.', 'loyalty_50', 250, 'Award'),
            (p_arena_id, 'Lenda da Arena', 'Completou 100 reservas.', 'loyalty_100', 500, 'Crown');
    END IF;
END;
$$;
