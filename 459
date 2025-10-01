/*
          # [Function Security] Secure handle_new_user_profile
          [This operation enhances the security of the function responsible for creating user profiles by setting a fixed search_path. This prevents potential hijacking attacks by ensuring the function only accesses objects within the 'public' schema.]

          ## Query Description: [This operation will alter the 'handle_new_user_profile' function to make it more secure. It is a non-destructive change that improves the function's robustness without affecting existing data or application logic.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function being altered: `public.handle_new_user_profile()`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Not Applicable]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None. This is a security enhancement with no performance overhead.]
          */

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, "clientType")
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    (NEW.raw_user_meta_data->>'clientType')::public.client_type
  );
  RETURN NEW;
END;
$$;
