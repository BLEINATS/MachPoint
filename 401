/*
          # [SECURITY] Set Search Path for handle_new_user_profile
          [This operation securely redefines the function that creates a user profile after they sign up, setting a fixed search_path to prevent potential hijacking vulnerabilities.]

          ## Query Description: [This operation re-creates a database function to improve security. It ensures the function runs with expected permissions and does not affect existing user data. No backup is required as it is a safe, structural change.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `handle_new_user_profile` will be redefined to include `SET search_path = 'public'`.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
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
