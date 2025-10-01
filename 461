/*
          # [Operation Name]
          Secure `handle_new_user` Function

          ## Query Description: [This operation updates the `handle_new_user` function to set a fixed `search_path`. This is a security best practice that prevents potential vulnerabilities related to search path hijacking, ensuring the function always references the correct database objects. It does not alter the function's logic or impact existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `handle_new_user` will be updated.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Superuser]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
  
  -- If the new user is an arena admin, create a corresponding arena
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'arenaName', 'Cidade Padrão', 'UF');
  END IF;
  
  RETURN NEW;
END;
$$;
