/*
          # [Function Security] Secure seed_gamification_defaults function
          [This operation recreates the `seed_gamification_defaults` function to include a fixed `search_path`, enhancing security by preventing potential hijacking vulnerabilities. This change is non-destructive and does not affect existing data.]

          ## Query Description: [This operation will safely drop and recreate a database function to improve security. It has no impact on stored data and is a recommended best practice.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `seed_gamification_defaults` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: [Not Changed]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Not Changed]
          - Triggers: [Not Changed]
          - Estimated Impact: [None]
          */

-- Drop the existing function first to ensure a clean recreation
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(p_arena_id uuid);

-- Create the new, secure version
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Seed gamification_settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, false, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed gamification_levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 500, 2),
        (p_arena_id, 'Ouro', 1500, 3),
        (p_arena_id, 'Platina', 3000, 4),
        (p_arena_id, 'Diamante', 5000, 5)
    ON CONFLICT (arena_id, level_rank) DO NOTHING;

    -- Seed gamification_rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
    VALUES
        (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10, true),
        (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 50, 'free_item', null, true)
    ON CONFLICT (arena_id, title) DO NOTHING;

    -- Seed gamification_achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Sua primeira jornada começa aqui.', 'first_reservation', 20, 'Star'),
        (p_arena_id, 'Fidelidade Bronze', 'Completou 10 reservas.', 'loyalty_10', 50, 'Award'),
        (p_arena_id, 'Fidelidade Prata', 'Completou 50 reservas.', 'loyalty_50', 250, 'Medal'),
        (p_arena_id, 'Fidelidade Ouro', 'Completou 100 reservas.', 'loyalty_100', 500, 'Trophy')
    ON CONFLICT (arena_id, type) DO NOTHING;
END;
$$;
