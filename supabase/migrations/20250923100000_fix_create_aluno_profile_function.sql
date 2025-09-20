/*
# [Fix] Função de Criação de Perfil de Cliente
[Este script corrige e torna mais segura a função que permite a um cliente criar seu próprio cadastro em uma arena ao fazer a primeira reserva.]

## Query Description: [Esta operação substitui a função `create_my_aluno_profile` por uma versão mais segura e robusta. A nova versão define um `search_path` para evitar vulnerabilidades, verifica se o usuário já tem um perfil na arena antes de tentar criar um novo, e garante que apenas usuários autenticados possam executá-la. Esta mudança é crucial para resolver a falha de "violates row-level security policy" de forma definitiva.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Função Modificada: `public.create_my_aluno_profile(uuid)`

## Security Implications:
- RLS Status: [N/A - Interage com RLS]
- Policy Changes: [No]
- Auth Requirements: [A função agora verifica explicitamente `auth.uid()` e é `SECURITY DEFINER` para executar com privilégios elevados de forma segura.]
- **Advisory Fix**: This change addresses the `[WARN] Function Search Path Mutable` security advisory by explicitly setting a `search_path`.

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo. O impacto no desempenho é negligenciável.]
*/

-- Remove a função antiga para garantir uma substituição limpa
DROP FUNCTION IF EXISTS public.create_my_aluno_profile(uuid);

-- Cria a nova versão segura da função
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
-- SECURITY DEFINER executa a função com os privilégios do criador (bypass RLS)
SECURITY DEFINER
-- Define um search_path seguro para prevenir ataques de hijacking
SET search_path = public;
AS $$
DECLARE
  aluno_id uuid;
  user_id uuid := auth.uid();
  user_name text;
  user_email text;
BEGIN
  -- Garante que apenas usuários autenticados possam chamar esta função
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário precisa estar autenticado para criar um perfil de cliente.';
  END IF;

  -- Busca o nome e email do usuário diretamente da tabela auth.users
  SELECT u.raw_user_meta_data->>'name', u.email
  INTO user_name, user_email
  FROM auth.users u
  WHERE u.id = user_id;

  -- Verifica se o cliente já não possui um cadastro nesta arena para evitar duplicatas
  PERFORM 1 FROM public.alunos a WHERE a.profile_id = user_id AND a.arena_id = p_arena_id;
  IF FOUND THEN
    -- Se já existe, não faz nada e retorna o ID existente para evitar erro.
    SELECT a.id INTO aluno_id FROM public.alunos a WHERE a.profile_id = user_id AND a.arena_id = p_arena_id;
    RETURN aluno_id;
  END IF;

  -- Insere o novo registro na tabela 'alunos'
  INSERT INTO public.alunos (profile_id, arena_id, name, email, status, plan_name, join_date)
  VALUES (
    user_id,
    p_arena_id,
    user_name,
    user_email,
    'ativo',
    'Avulso',
    now()
  )
  RETURNING id INTO aluno_id;

  RETURN aluno_id;
END;
$$;
