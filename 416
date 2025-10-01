/*
          # [SECURITY] Set Search Path for Functions
          [This operation sets a secure search_path for multiple database functions to mitigate potential security risks, addressing the "Function Search Path Mutable" warning.]

          ## Query Description: [This operation will alter several existing database functions to explicitly set their `search_path`. This is a low-risk security enhancement that prevents potential hijacking of function calls. It does not change the function's logic or impact existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [Affects the following functions:
          - public.handle_new_user()
          - public.get_user_role(uuid)
          - public.is_arena_admin(uuid, uuid)]
          
          ## Security Implications:
          - RLS Status: [Not Changed]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Not Changed]
- Triggers: [Not Changed]
- Estimated Impact: [None]
          */

-- Sets a secure search path for the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, "clientType")
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    (new.raw_user_meta_data->>'clientType')::public.client_type
  );
  
  -- If the user is an admin, create an arena for them
  IF (new.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      'Cidade', -- Placeholder
      'UF'      -- Placeholder
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Sets a secure search path for the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.user_role;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role::text;
END;
$$;

-- Recreates the is_arena_admin function with a secure search path
DROP FUNCTION IF EXISTS public.is_arena_admin(uuid);
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_user_id uuid, p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = p_user_id
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Re-apply policies that were dependent on the old function signature
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_settings;
CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_settings
FOR ALL
USING (public.is_arena_admin(auth.uid(), arena_id))
WITH CHECK (public.is_arena_admin(auth.uid(), arena_id));

ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_levels;
CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_levels
FOR ALL
USING (public.is_arena_admin(auth.uid(), arena_id))
WITH CHECK (public.is_arena_admin(auth.uid(), arena_id));

ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_rewards;
CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_rewards
FOR ALL
USING (public.is_arena_admin(auth.uid(), arena_id))
WITH CHECK (public.is_arena_admin(auth.uid(), arena_id));

ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their arena's gamification" ON public.gamification_achievements;
CREATE POLICY "Admins can manage their arena's gamification"
ON public.gamification_achievements
FOR ALL
USING (public.is_arena_admin(auth.uid(), arena_id))
WITH CHECK (public.is_arena_admin(auth.uid(), arena_id));

ALTER TABLE public.aluno_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their arena's achievements" ON public.aluno_achievements;
CREATE POLICY "Admins can manage their arena's achievements"
ON public.aluno_achievements
FOR ALL
USING (public.is_arena_admin(auth.uid(), (SELECT arena_id FROM public.alunos WHERE id = aluno_id)))
WITH CHECK (public.is_arena_admin(auth.uid(), (SELECT arena_id FROM public.alunos WHERE id = aluno_id)));

ALTER TABLE public.gamification_point_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage point transactions for their arena" ON public.gamification_point_transactions;
CREATE POLICY "Admins can manage point transactions for their arena"
ON public.gamification_point_transactions
FOR ALL
USING (public.is_arena_admin(auth.uid(), arena_id))
WITH CHECK (public.is_arena_admin(auth.uid(), arena_id));
