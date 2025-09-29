-- Remove o trigger existente que usa a função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove a função antiga, se ela existir
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Recria a função com o search_path definido para maior segurança
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'role')::public.user_role
  );
  RETURN new;
END;
$$;

-- Recria o trigger para chamar a nova função segura
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
