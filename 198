/*
  # [Function Security] Secure `handle_new_user_profile`
  [This operation secures the `handle_new_user_profile` function by setting a fixed `search_path`. This is a preventative security measure to mitigate potential risks, as recommended by Supabase security advisories.]

  ## Query Description: [This operation will briefly drop and recreate the trigger responsible for creating user profiles upon new sign-ups. The function itself will be replaced with a more secure version. There is no impact on existing data. The process is designed to be seamless, but there's a minimal theoretical risk of a new user sign-up failing if it occurs in the exact milliseconds between the trigger drop and recreation.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Drops trigger: `on_auth_user_created` on `auth.users`
  - Recreates function: `public.handle_new_user_profile()`
  - Recreates trigger: `on_auth_user_created` on `auth.users`
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Superuser]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [Recreated]
  - Estimated Impact: [Negligible. The operation is nearly instantaneous.]
*/
-- Step 1: Drop the existing trigger that depends on the function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Recreate the function with the security definer and search_path set.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::text,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
