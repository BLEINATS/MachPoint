/*
          # [Function Security] Secure handle_new_user_profile
          [This operation secures the handle_new_user_profile function by setting a fixed search_path, preventing potential hijacking attacks.]

          ## Query Description: [This operation will briefly drop and recreate the trigger and function responsible for creating user profiles. There is no impact on existing data. This is a safe and recommended security enhancement.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.handle_new_user_profile()
          - Trigger: on_auth_user_created on auth.users
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [N/A]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [Modified]
          - Estimated Impact: [Negligible. The function is only called upon new user creation.]
          */
-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, "clientType")
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    (NEW.raw_user_meta_data ->> 'clientType')::public.client_type
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
