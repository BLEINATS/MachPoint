/*
          # Criação da Tabela de Perfis e Gatilho de Sincronização

          Este script cria a tabela `profiles` para armazenar dados públicos dos usuários e configura um gatilho para popular automaticamente essa tabela sempre que um novo usuário for criado no sistema de autenticação do Supabase.

          ## Query Description: 
          - **Criação da Tabela `profiles`**: Armazena informações adicionais do usuário que não devem ficar na tabela `auth.users`, como nome, avatar e tipo de conta (role). A coluna `id` é uma chave estrangeira que referencia `auth.users.id`, garantindo a integridade dos dados.
          - **Criação da Função `handle_new_user`**: Esta função é acionada após a criação de um novo usuário. Ela insere uma nova linha na tabela `public.profiles`, copiando o `id` e o `email` do novo usuário e extraindo metadados (como `role` e `name`) que foram passados durante o `signUp`.
          - **Criação do Gatilho `on_auth_user_created`**: Associa a função `handle_new_user` ao evento de inserção na tabela `auth.users`. Isso automatiza a criação de perfis.
          - **Habilitação de RLS**: Ativa a Segurança em Nível de Linha (RLS) na tabela `profiles` para garantir que os dados dos usuários sejam protegidos.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true (com a remoção manual do gatilho, função e tabela)
          
          ## Structure Details:
          - **Tabela Adicionada**: `public.profiles`
          - **Função Adicionada**: `public.handle_new_user()`
          - **Gatilho Adicionado**: `on_auth_user_created` na tabela `auth.users`
          
          ## Security Implications:
          - RLS Status: Habilitado para `public.profiles`. Políticas de segurança precisarão ser criadas para permitir que os usuários acessem e modifiquem seus próprios perfis.
          - Policy Changes: Não
          - Auth Requirements: Acesso para criar tabelas, funções e gatilhos.
          
          ## Performance Impact:
          - Indexes: Chave primária em `profiles.id` é criada automaticamente.
          - Triggers: Adiciona um pequeno overhead na criação de usuários, o que é desprezível.
          - Estimated Impact: Baixo.
          */

-- 1. Create public.profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  avatar_url VARCHAR(255),
  role VARCHAR(50) DEFAULT 'cliente'::character varying,
  arena_id UUID,
  client_type VARCHAR(50),
  birth_date DATE,
  gender VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- 2. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, client_type, arena_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'clientType',
    (NEW.raw_user_meta_data->>'arena_id')::UUID
  );
  RETURN NEW;
END;
$$;

-- 3. Create a trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for profiles table

-- Policy: Allow users to read their own profile
CREATE POLICY "Allow individual read access"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow individual update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant usage on the public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select permission on the profiles table to anon and authenticated roles
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;

-- Grant insert, update, delete permissions on the profiles table to the authenticated role
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
