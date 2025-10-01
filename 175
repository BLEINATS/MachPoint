/*
  # [SECURITY] Set search_path for Core Functions
  [This migration sets a fixed search_path for core database functions to mitigate potential security risks, as recommended by Supabase security advisories.]

  ## Query Description: [This operation modifies existing database functions to explicitly set their search path. This is a security best practice that prevents certain types of attacks. It does not alter the function's logic or impact existing data.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Functions affected: `is_arena_admin`, `handle_new_user_profile`
  
  ## Security Implications:
  - RLS Status: [Not Changed]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [Not Changed]
  - Triggers: [Not Changed]
  - Estimated Impact: [None]
*/

-- Apply security setting to is_arena_admin function
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
END;
$$;

-- Apply security setting to handle_new_user_profile function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role
  );
  
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, slug, city, state)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      (LOWER(regexp_replace(NEW.raw_user_meta_data->>'name', '[^a-zA-Z0-9]+', '-', 'g'))),
      'Cidade',
      'UF'
    );
  END IF;
  
  RETURN NEW;
END;
$$;
