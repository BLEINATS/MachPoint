/*
  # [SECURITY] Harden seed_gamification_defaults function
  [This operation secures the `seed_gamification_defaults` function by explicitly setting its search path, mitigating a security vulnerability.]

  ## Query Description: [This operation redefines a database function to enhance security. It sets a fixed `search_path` to prevent potential hijacking by malicious users with `CREATE` privileges on other schemas. This change is non-destructive and does not affect existing data or application functionality.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being modified: `public.seed_gamification_defaults(uuid)`
  
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
SET search_path = ''
AS $$
BEGIN
    -- Seed gamification settings if they don't exist
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    SELECT p_arena_id, false, 10, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.gamification_settings WHERE arena_id = p_arena_id);

    -- Seed default levels if none exist for the arena
    IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
        INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
        VALUES
            (p_arena_id, 'Bronze', 0, 1),
            (p_arena_id, 'Prata', 500, 2),
            (p_arena_id, 'Ouro', 1500, 3),
            (p_arena_id, 'Platina', 3000, 4),
            (p_arena_id, 'Diamante', 5000, 5);
    END IF;
END;
$$;
