/*
# [Security Fix] Set Search Path for handle_new_user_profile
[This operation secures the `handle_new_user_profile` function by setting a fixed search_path, mitigating potential security risks as flagged by Supabase security advisories.]

## Query Description: [This operation will safely update an existing database function. It modifies the function's security settings without altering its core logic, ensuring no impact on user data or application functionality. No backup is required for this safe, reversible change.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.handle_new_user_profile()`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

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
  INSERT INTO public.profiles (id, name, email, role, clientType)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    (NEW.raw_user_meta_data->>'clientType')::public.client_type
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Se for um admin de arena, cria a arena associada
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name', -- Usa o nome da arena fornecido no cadastro
      'Cidade a definir', -- Valor padrão
      'Estado a definir' -- Valor padrão
    )
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
