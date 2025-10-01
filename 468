/*
  # [Operation Name]
  [This operation secures the 'handle_new_user_profile' function and its trigger by setting a fixed search_path, mitigating a security advisory.]
  ## Query Description: [This script safely drops and recreates a database function and its associated trigger to apply security best practices. It modifies the function's definition to prevent potential search_path hijacking vulnerabilities, without altering its core logic or impacting existing data. This is a low-risk, preventative security enhancement.]
  ## Metadata:
  - Schema-Category: 'Security'
  - Impact-Level: 'Low'
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'handle_new_user_profile' will be dropped and recreated.
  - Trigger 'on_auth_user_created' on 'auth.users' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: Modified
  - Estimated Impact: Negligible. This change only affects the function's security context.
*/
-- Drop the existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
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
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    (new.raw_user_meta_data->>'clientType')::public.client_type
  );
  -- If the new user is an arena admin, also create an arena for them
  IF (new.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state)
    VALUES (new.id, new.raw_user_meta_data->>'name', 'Cidade', 'UF');
  END IF;
  RETURN new;
END;
$$;
-- Recreate the trigger to call the new function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
