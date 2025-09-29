/*
# [Security Enhancement] Secure seed_gamification_defaults Function
[This operation secures the `seed_gamification_defaults` function by setting a fixed search_path, mitigating potential security risks as advised by Supabase.]

## Query Description: [This operation will safely recreate the `seed_gamification_defaults` function to improve security. It has no impact on existing data and is a preventative measure.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.seed_gamification_defaults(uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [service_role or owner]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Seed default settings if they don't exist for the arena
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, false, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed default levels if they don't exist for the arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 500, 2),
            (p_arena_id, 'Ouro', 2000, 3),
            (p_arena_id, 'Platina', 5000, 4),
            (p_arena_id, 'Diamante', 10000, 5);
    END IF;

    -- Seed default rewards if they don't exist for the arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
        VALUES
            (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10, true),
            (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 50, 'free_item', null, true);
    END IF;

    -- Seed default achievements if they don't exist for the arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Sua primeira jornada começa aqui!', 'first_reservation', 25, 'Star'),
            (p_arena_id, 'Fidelidade Bronze', 'Completou 10 reservas. Você é um cliente fiel!', 'loyalty_10', 50, 'Award'),
            (p_arena_id, 'Fidelidade Prata', 'Completou 50 reservas. Parte da família!', 'loyalty_50', 250, 'Shield'),
            (p_arena_id, 'Fidelidade Ouro', 'Completou 100 reservas. Uma lenda da arena!', 'loyalty_100', 1000, 'Crown');
    END IF;
END;
$$;

ALTER FUNCTION public.seed_gamification_defaults(uuid) SET search_path = 'public';
