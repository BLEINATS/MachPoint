-- Remove o gatilho dependente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove a função antiga
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Recria a função com o search_path definido para maior segurança
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

-- Recria o gatilho
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
