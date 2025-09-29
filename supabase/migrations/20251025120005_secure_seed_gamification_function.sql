/*
          # [Operation Name]
          Secure Gamification Seeding Function

          ## Query Description: [This operation secures the `seed_gamification_defaults` function by explicitly setting its `search_path`. This is a preventative security measure to ensure the function operates in a predictable and safe schema context, mitigating potential risks associated with mutable search paths. It does not alter any existing data or user-facing functionality.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function `public.seed_gamification_defaults(uuid)` will be replaced.
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: None
          */

DROP FUNCTION IF EXISTS public.seed_gamification_defaults(uuid);

CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;
AS $$
BEGIN
    -- Seed gamification_settings
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Seed gamification_levels
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 500, 2),
        (p_arena_id, 'Ouro', 1500, 3),
        (p_arena_id, 'Platina', 3000, 4)
    ON CONFLICT (arena_id, level_rank) DO NOTHING;

    -- Seed gamification_achievements
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
        (p_arena_id, 'Primeira Reserva', 'Sua primeira reserva na arena!', 'first_reservation', 50, 'Sparkles'),
        (p_arena_id, 'Fiel da Casa', '10 reservas completadas', 'loyalty_10', 100, 'Heart'),
        (p_arena_id, 'Sócio-Torcedor', '50 reservas completadas', 'loyalty_50', 500, 'Gem'),
        (p_arena_id, 'Lenda da Arena', '100 reservas completadas', 'loyalty_100', 1000, 'Crown')
    ON CONFLICT (arena_id, type) DO NOTHING;
END;
$$;
