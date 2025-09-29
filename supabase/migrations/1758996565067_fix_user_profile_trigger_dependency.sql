/*
          # Safely Recreate User Profile Trigger and Function
          [This operation safely recreates the trigger and function responsible for creating user profiles. It resolves a dependency error by first removing the trigger, then updating the function, and finally recreating the trigger.]

          ## Query Description: [This script addresses a dependency error where a trigger prevented its underlying function from being updated. It works by temporarily dropping the 'on_auth_user_created' trigger, updating the 'handle_new_user_profile' function with the correct logic, and then recreating the trigger. This ensures the user profile creation process is stable and correct without affecting existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops trigger 'on_auth_user_created' from 'auth.users'.
          - Drops and recreates the function 'handle_new_user_profile'.
          - Recreates the trigger 'on_auth_user_created' on 'auth.users'.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [Recreated]
          - Estimated Impact: [Negligible. The trigger runs once per new user sign-up.]
          */

-- Step 1: Drop the dependent trigger first.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the old function.
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Step 3: Recreate the function with the correct and secure definition.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Step 4: Recreate the trigger to use the new function.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
