/*
          # [Function Security] Secure handle_new_user_profile function
          [This operation enhances the security of the handle_new_user_profile function by setting a fixed search_path. This prevents potential hijacking attacks by ensuring the function only looks for objects in trusted schemas (public, auth). It's a preventative security measure with no impact on functionality.]

          ## Query Description: [This operation will update the handle_new_user_profile function to improve its security. It does not alter any data and is a safe, reversible change.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.handle_new_user_profile()
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Superuser]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None. This is a metadata change to the function definition.]
          */
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, clientType)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    (NEW.raw_user_meta_data->>'clientType')::public.client_type
  );
  
  -- If the new user is an admin, create an arena for them
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state, slug)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      'Cidade', -- Placeholder
      'UF',      -- Placeholder
      -- Generate a simple slug from the arena name
      lower(regexp_replace(NEW.raw_user_meta_data->>'name', '[^a-zA-Z0-9]+', '-', 'g'))
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
