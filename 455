/*
# [Function Security Update] Secure User Profile and Gamification Seeding Functions
This migration enhances the security of two key functions by explicitly setting the search_path. This prevents potential security vulnerabilities related to search path hijacking.

## Query Description:
- **handle_new_user_profile**: This function is triggered when a new user signs up. It creates a corresponding entry in the `public.profiles` table and, if the user is an admin, creates a new arena. The `search_path` is set to `public` to ensure it only interacts with tables in the public schema.
- **seed_gamification_defaults**: This function initializes the gamification system with default levels, rewards, and achievements for a new arena. The `search_path` is set to `public` for security.
The migration temporarily drops and recreates the trigger associated with `handle_new_user_profile` to apply the changes.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by reverting to the previous function definitions)

## Structure Details:
- Functions affected: `handle_new_user_profile`, `seed_gamification_defaults`
- Triggers affected: `on_auth_user_created` (dropped and recreated)

## Security Implications:
- RLS Status: Not directly changed, but functions are used in RLS policies.
- Policy Changes: No
- Auth Requirements: Admin privileges to alter functions and triggers.
- Mitigates: Search path hijacking vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: `on_auth_user_created` is temporarily removed and recreated. This might cause a brief moment where new user profiles are not created if a user signs up at the exact moment the migration is running, but this is extremely unlikely.
- Estimated Impact: Negligible.
*/

-- Step 1: Drop the existing trigger to avoid dependency issues on the function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Update the 'handle_new_user_profile' function with a secure search_path.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'role')::public.user_role
  );
  
  IF (new.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state, slug)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      'Não definida',
      'ND',
      public.slugify(new.raw_user_meta_data->>'name') || '-' || substr(new.id::text, 1, 4)
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Step 3: Recreate the trigger to use the updated function.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 4: Update the 'seed_gamification_defaults' function with a secure search_path.
CREATE OR REPLACE FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Seed settings if not exist
  INSERT INTO public.gamification_settings (arena_id)
  VALUES (p_arena_id)
  ON CONFLICT (arena_id) DO NOTHING;

  -- Seed levels if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_levels WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_levels (arena_id, name, points_required, level_rank)
    VALUES
      (p_arena_id, 'Bronze', 0, 1),
      (p_arena_id, 'Prata', 500, 2),
      (p_arena_id, 'Ouro', 1500, 3),
      (p_arena_id, 'Platina', 3000, 4),
      (p_arena_id, 'Diamante', 5000, 5);
  END IF;
  
  -- Seed rewards if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_rewards WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_rewards (arena_id, title, description, points_cost, type, value, is_active)
    VALUES
      (p_arena_id, 'Desconto R$ 10', 'Use seus pontos para ganhar R$ 10 de desconto.', 200, 'discount', 10, true),
      (p_arena_id, 'Bebida Grátis', 'Troque seus pontos por uma bebida (água ou isotônico).', 100, 'free_item', null, true);
  END IF;
  
  -- Seed achievements if not exist for this arena
  IF NOT EXISTS (SELECT 1 FROM public.gamification_achievements WHERE arena_id = p_arena_id) THEN
    INSERT INTO public.gamification_achievements (arena_id, name, description, type, points_reward, icon)
    VALUES
      (p_arena_id, 'Primeira Reserva', 'Concluiu sua primeira reserva na arena.', 'first_reservation', 50, 'Star'),
      (p_arena_id, 'Fidelidade', 'Completou 10 reservas na arena.', 'loyalty_10', 100, 'Heart');
  END IF;
END;
$$;
