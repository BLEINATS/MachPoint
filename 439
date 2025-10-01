/*
# [Function Security Hardening]
[This operation secures the `seed_gamification_defaults` function by setting a non-mutable search_path, mitigating potential security risks related to search path hijacking.]

## Query Description: [This operation replaces an existing database function with a more secure version. It is a non-destructive change that improves security by explicitly setting the function's search path. There is no risk to existing data.]

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
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [Negligible performance impact.]
*/
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ativar o sistema de gamificação por padrão
    INSERT INTO public.gamification_settings (arena_id, is_enabled, points_per_reservation, points_per_real)
    VALUES (p_arena_id, true, 10, 1)
    ON CONFLICT (arena_id) DO NOTHING;

    -- Inserir níveis padrão se não existirem
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
        (p_arena_id, 'Bronze', 0, 1),
        (p_arena_id, 'Prata', 100, 2),
        (p_arena_id, 'Ouro', 500, 3),
        (p_arena_id, 'Platina', 1000, 4),
        (p_arena_id, 'Diamante', 2500, 5)
    ON CONFLICT (arena_id, level_rank) DO NOTHING;
END;
$$;
