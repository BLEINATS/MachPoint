/*
          # [Function Security] Secure handle_new_user_profile
          [This operation secures the handle_new_user_profile function by explicitly setting its search_path, mitigating a security advisory.]

          ## Query Description: [This operation will temporarily drop and then recreate the trigger that automatically creates a user profile. This is a safe and standard procedure to update the underlying function. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.handle_new_user_profile()
          - Trigger: on_auth_user_created on auth.users
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [Admin privileges]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Recreated]
          - Estimated Impact: [None]
          */

-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, clientType)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name', 
    new.email, 
    (new.raw_user_meta_data->>'role')::public.user_role, 
    (new.raw_user_meta_data->>'clientType')::public.client_type
  );
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
