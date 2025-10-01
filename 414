/*
# [SECURITY] Harden handle_new_user_profile function
[This operation secures the `handle_new_user_profile` function by setting a fixed search_path, mitigating potential security risks.]

## Query Description: [This script temporarily drops the trigger that automatically creates user profiles, updates the underlying function to be more secure, and then recreates the trigger. This is a safe, standard procedure for updating function definitions that have dependent objects. There is no impact on existing data.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function `handle_new_user_profile` will be dropped and recreated.
- Trigger `on_auth_user_created` on `auth.users` will be dropped and recreated.

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [Superuser]

## Performance Impact:
- Indexes: [Not Changed]
- Triggers: [Modified]
- Estimated Impact: [Negligible. The trigger is only fired on new user creation.]
*/

-- Drop the dependent trigger first
DROP TRIGGER if exists on_auth_user_created on auth.users;

-- Drop the existing function
DROP FUNCTION if exists public.handle_new_user_profile();

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, clientType)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    (NEW.raw_user_meta_data->>'clientType')::public.client_type
  );
  
  -- If the user is an admin, create an arena for them
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      'Cidade', -- Placeholder
      'UF'      -- Placeholder
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
