/*
# [Function] seed_gamification_defaults
[Description: Seeds the default gamification settings, levels, rewards, and achievements for a new arena if they do not already exist. This ensures a baseline configuration for the gamification system.]

## Query Description: [This operation is safe and idempotent. It only inserts data if it's missing, so it will not overwrite existing custom configurations. It has no impact on existing user data.]

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables affected: gamification_settings, gamification_levels, gamification_rewards, gamification_achievements
- Operation: INSERT (conditional)

## Security Implications:
- RLS Status: [Enabled on target tables]
- Policy Changes: [No]
- Auth Requirements: [service_role or authenticated user with appropriate RLS]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Low, runs only once per arena on initial setup.]
*/
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Seed settings if not exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
        VALUES (p_arena_id, false, 10, 1);
    END IF;

    -- Seed levels if not exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Iniciante', 0, 1),
            (p_arena_id, 'Bronze', 100, 2),
            (p_arena_id, 'Prata', 500, 3),
            (p_arena_id, 'Ouro', 1500, 4),
            (p_arena_id, 'Platina', 3000, 5);
    END IF;

    -- Seed rewards if not exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
        VALUES
            (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 200, 'discount', 10, true),
            (p_arena_id, 'Aluguel de Raquete Grátis', 'Alugue uma raquete sem custo para sua próxima partida.', 100, 'free_item', null, true);
    END IF;

    -- Seed achievements if not exist
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Sua jornada começa aqui!', 'first_reservation', 20, 'Star'),
            (p_arena_id, 'Fiel Escudeiro', 'Complete 10 reservas na arena.', 'loyalty_10', 50, 'Shield'),
            (p_arena_id, 'Rei da Quadra', 'Complete 50 reservas na arena.', 'loyalty_50', 250, 'Crown');
    END IF;
END;
$$;
