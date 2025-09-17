/*
  # [Estrutura da Tabela de Arenas]
  Cria a tabela 'arenas' para armazenar todas as configurações e dados específicos de cada arena, estabelecendo a base do sistema multi-tenant.
  ## Query Description: [Este script cria a tabela 'arenas' com todos os campos necessários para o perfil da arena (endereço, contatos, políticas, etc.). Ele também cria uma função 'slugify' para gerar URLs amigáveis, e um gatilho (trigger) que cria automaticamente uma nova arena quando um usuário do tipo 'admin_arena' se cadastra. Políticas de Segurança em Nível de Linha (RLS) são ativadas para garantir que um administrador só possa editar sua própria arena, mas que os dados públicos possam ser visualizados por todos.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela afetada: `public.arenas` (será criada)
  - Tabela afetada: `public.profiles` (será adicionada uma Foreign Key)
  - Função afetada: `public.slugify` (será criada)
  - Função afetada: `public.handle_new_admin_user` (será criada)
  - Gatilho afetado: Em `auth.users` (será criado)
  ## Security Implications:
  - RLS Status: Será ativado na tabela `public.arenas`.
  - Policy Changes: Sim, serão criadas políticas de acesso para a tabela `public.arenas`.
  - Auth Requirements: Acesso de administrador para executar.
  ## Performance Impact:
  - Indexes: Chaves primárias e índices de chave estrangeira serão criados.
  - Triggers: Um novo gatilho será adicionado à tabela `auth.users`. O impacto é mínimo.
  - Estimated Impact: Baixo.
*/
-- 1. Função para criar slugs amigáveis a partir de um texto
CREATE OR REPLACE FUNCTION public.slugify(
  v TEXT
) RETURNS TEXT AS $$
BEGIN
  -- 1. Remove acentos
  v := translate(v,
    'áàâãäåāăąçćčďđéèêëēĕėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż',
    'aaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz'
  );
  -- 2. Converte para minúsculas
  v := lower(v);
  -- 3. Substitui caracteres não alfanuméricos por hífen
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
  -- 4. Remove hífens do início e do fim
  v := regexp_replace(v, '^-+|-+$', '', 'g');
  RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- 2. Criação da tabela de Arenas
CREATE TABLE public.arenas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  cnpj_cpf text,
  responsible_name text,
  contact_phone text,
  public_email text,
  cep text,
  address text,
  number text,
  neighborhood text,
  city text,
  state text,
  google_maps_link text,
  cancellation_policy text,
  terms_of_use text,
  CONSTRAINT arenas_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.arenas IS 'Armazena os dados de configuração de cada arena.';
-- 3. Adiciona a chave estrangeira na tabela de perfis
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_arena_id_fkey
FOREIGN KEY (arena_id) REFERENCES public.arenas(id) ON DELETE SET NULL;
-- 4. Função para criar uma arena automaticamente para um novo admin
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_arena_id uuid;
BEGIN
  -- Verifica se o novo usuário tem a role 'admin_arena'
  IF new.raw_user_meta_data->>'role' = 'admin_arena' THEN
    -- Insere uma nova arena e obtém seu ID
    INSERT INTO public.arenas (owner_id, name, slug)
    VALUES (new.id, new.raw_user_meta_data->>'name', public.slugify(new.raw_user_meta_data->>'name'))
    RETURNING id INTO new_arena_id;
    -- Atualiza o perfil do usuário com o ID da nova arena
    UPDATE public.profiles
    SET arena_id = new_arena_id
    WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$;
-- 5. Gatilho (Trigger) para executar a função após o cadastro de um usuário
CREATE TRIGGER on_new_admin_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();
-- 6. Habilita a Segurança em Nível de Linha (RLS)
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
-- 7. Políticas de Segurança para a tabela de Arenas
CREATE POLICY "Arenas are viewable by everyone."
  ON public.arenas FOR SELECT
  USING ( true );
CREATE POLICY "Arena owners can update their own arena."
  ON public.arenas FOR UPDATE
  USING ( auth.uid() = owner_id );
CREATE POLICY "Arena owners can insert their own arena."
  ON public.arenas FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );
-- 8. Concede permissões para os roles 'anon' e 'authenticated'
GRANT ALL ON TABLE public.arenas TO anon;
GRANT ALL ON TABLE public.arenas TO authenticated;
GRANT ALL ON FUNCTION public.slugify(text) TO anon;
GRANT ALL ON FUNCTION public.slugify(text) TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_admin_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_admin_user() TO authenticated;
