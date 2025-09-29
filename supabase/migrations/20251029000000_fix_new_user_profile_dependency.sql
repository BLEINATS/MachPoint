/*
          # [Fix] Corrige Dependência do Gatilho de Novo Usuário
          [Este script remove e recria de forma segura o gatilho e a função que criam um perfil público para um novo usuário autenticado, resolvendo um problema de dependência que impede a modificação da função.]

          ## Query Description: [Operação segura para reestruturação de função. Remove e recria um gatilho e uma função do sistema de perfis. Não há risco de perda de dados, pois a lógica é recriada imediatamente.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Modified: None
          - Functions Modified: [public.handle_new_user_profile]
          - Triggers Modified: [on_auth_user_created on auth.users]
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [Recreated]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Remove o gatilho dependente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove a função antiga
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Recria a função com a lógica correta e segura
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
    NEW.raw_user_meta_data ->> 'name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    (NEW.raw_user_meta_data ->> 'clientType')::public.client_type
  );
  RETURN NEW;
END;
$$;

-- Recria o gatilho
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();
