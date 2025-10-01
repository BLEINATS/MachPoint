/*
          # [Function-Security] Secure seed_gamification_defaults
          [This operation secures the `seed_gamification_defaults` function by setting a fixed `search_path`, preventing potential hijacking vulnerabilities.]

          ## Query Description: [This script will recreate the `seed_gamification_defaults` function to include `SET search_path = 'public'`. This is a security enhancement that does not change the function's behavior. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: `public.seed_gamification_defaults(p_arena_id uuid)`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Not Applicable]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

-- Recreate the function with security best practices
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Seed general settings if they don't exist
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed default levels if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 500, 2),
            (p_arena_id, 'Ouro', 1500, 3),
            (p_arena_id, 'Platina', 3000, 4),
            (p_arena_id, 'Diamante', 5000, 5);
    END IF;

    -- Seed default rewards if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
        VALUES
            (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto em uma reserva.', 1000, 'discount', 10, true),
            (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 250, 'free_item', null, true);
    END IF;

    -- Seed default achievements if they don't exist for this arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
        VALUES
            (p_arena_id, 'Primeira Reserva', 'Sua primeira reserva concluída na arena.', 'first_reservation', 50, 'Star'),
            (p_arena_id, 'Fidelidade Bronze', 'Complete 10 reservas na arena.', 'loyalty_10', 100, 'Award'),
            (p_arena_id, 'Fidelidade Prata', 'Complete 50 reservas na arena.', 'loyalty_50', 500, 'Medal'),
            (p_arena_id, 'Fidelidade Ouro', 'Complete 100 reservas na arena.', 'loyalty_100', 1000, 'Trophy');
    END IF;
END;
$$;

ALTER FUNCTION public.seed_gamification_defaults(uuid) SET search_path = 'public';
