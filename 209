/*
          # [Function Security] Secure handle_new_user_profile Function
          [This operation secures the handle_new_user_profile function by setting a fixed search_path, preventing potential hijacking vulnerabilities.]

          ## Query Description: [This script temporarily removes the trigger that automatically creates a user profile, updates the underlying function to make it more secure, and then recreates the trigger. This is a safe, non-destructive operation.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `public.handle_new_user_profile` will be updated.
          - Trigger `on_auth_user_created` on table `auth.users` will be temporarily dropped and recreated.
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [Admin privileges required to run this script.]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [Recreated]
          - Estimated Impact: [Negligible. This is a one-time structural change with no impact on query performance.]
          */

-- Drop the existing trigger to allow function replacement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, clientType)
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
