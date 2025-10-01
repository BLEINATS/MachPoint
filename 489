/*
  # [Operation Name]
  [This operation secures the 'seed_gamification_defaults' function by setting a fixed search_path, mitigating a security advisory.]
  ## Query Description: [This script safely drops and recreates a database function to apply security best practices. It modifies the function's definition to prevent potential search_path hijacking vulnerabilities, without altering its core logic or impacting existing data. This is a low-risk, preventative security enhancement.]
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'seed_gamification_defaults' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. This change only affects the function's security context.
*/
DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Seed Settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;
    -- Seed Levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 100, 2),
        (p_arena_id, 'Ouro', 500, 3),
        (p_arena_id, 'Platina', 1000, 4),
        (p_arena_id, 'Diamante', 2500, 5)
    ON CONFLICT (arena_id, level_rank) DO NOTHING;
    -- Seed Rewards
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
    VALUES
        (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 100, 'discount', 10, true),
        (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 50, 'free_item', null, true)
    ON CONFLICT (arena_id, title) DO NOTHING;
    -- Seed Achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Concedido por fazer sua primeira reserva na arena.', 'first_reservation', 20, 'Sparkles'),
        (p_arena_id, 'Fidelidade Bronze', 'Concedido por completar 10 reservas.', 'loyalty_10', 50, 'Medal'),
        (p_arena_id, 'Fidelidade Prata', 'Concedido por completar 50 reservas.', 'loyalty_50', 100, 'Award'),
        (p_arena_id, 'Fidelidade Ouro', 'Concedido por completar 100 reservas.', 'loyalty_100', 250, 'Trophy')
    ON CONFLICT (arena_id, type) DO NOTHING;
END;
$$;
