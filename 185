/*
  # [SECURITY] Set Search Path for seed_gamification_defaults
  [This operation updates the 'seed_gamification_defaults' function to explicitly set the search_path, mitigating a security risk identified by Supabase.]

  ## Query Description: [This change enhances the security of the function that sets up default gamification data. It does not alter the function's logic or impact existing data. It's a safe and recommended preventative measure.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being modified: `public.seed_gamification_defaults(p_arena_id uuid)`
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
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
  SET search_path = 'public';

  -- Seed Gamification Settings if not exist
  INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
  VALUES (p_arena_id, true, 10, 1)
  ON CONFLICT (arena_id) DO NOTHING;

  -- Seed Gamification Levels if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
      (p_arena_id, 'Iniciante', 0, 1),
      (p_arena_id, 'Bronze', 100, 2),
      (p_arena_id, 'Prata', 500, 3),
      (p_arena_id, 'Ouro', 1000, 4),
      (p_arena_id, 'Platina', 2500, 5);
  END IF;

  -- Seed default Rewards if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
    VALUES
      (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 200, 'discount', 10, true),
      (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 50, 'free_item', 1, true);
  END IF;

  -- Seed default Achievements if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
      (p_arena_id, 'Primeira Reserva', 'Sua primeira jornada começa aqui!', 'first_reservation', 20, 'Sparkles'),
      (p_arena_id, 'Fidelidade Bronze', 'Complete 10 reservas na arena.', 'loyalty_10', 50, 'Award'),
      (p_arena_id, 'Fidelidade Prata', 'Complete 50 reservas na arena.', 'loyalty_50', 250, 'Medal'),
      (p_arena_id, 'Fidelidade Ouro', 'Complete 100 reservas na arena.', 'loyalty_100', 500, 'Trophy');
  END IF;

END;
$$;
