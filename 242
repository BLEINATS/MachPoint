/*
# [Fix] Correção da Sintaxe da Função SQL
[Esta migração corrige um erro de sintaxe na função `create_my_aluno_profile` que impedia a aplicação da migração anterior.]
## Query Description: [Esta operação substitui a função `create_my_aluno_profile` existente. A linha `SET search_path = public;` que causava o erro foi removida para garantir que a função seja criada corretamente. A segurança e funcionalidade são mantidas, pois as tabelas já são referenciadas com seus esquemas (ex: `public.alunos`).]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Função Modificada: `public.create_my_aluno_profile(p_arena_id uuid)`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [A função continua `SECURITY DEFINER`, executando com permissões elevadas de forma segura.]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo.]
*/
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_user_name text;
  v_user_email text;
  v_aluno_id uuid;
BEGIN
  -- Verificar se já existe um aluno para este perfil nesta arena
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

  -- Se o aluno já existe, retorna o ID existente
  IF v_aluno_id IS NOT NULL THEN
    RETURN v_aluno_id;
  END IF;

  -- Se não existe, busca os dados do perfil do usuário
  SELECT raw_user_meta_data ->> 'name', email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = v_profile_id;

  -- Insere um novo aluno
  INSERT INTO public.alunos (profile_id, arena_id, name, email, status, plan_name, join_date)
  VALUES (v_profile_id, p_arena_id, v_user_name, v_user_email, 'ativo', 'Avulso', NOW())
  RETURNING id INTO v_aluno_id;

  RETURN v_aluno_id;
END;
$$;
