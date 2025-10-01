/*
# [Feature] RPC para Auto-Criação de Perfil de Aluno
[Cria uma função `create_my_aluno_profile` que permite a um usuário autenticado criar seu próprio registro na tabela `alunos` para uma arena específica, contornando RLS de forma segura.]

## Query Description: [Esta operação adiciona uma nova função `create_my_aluno_profile` ao banco de dados. A função é `SECURITY DEFINER`, o que significa que ela executa com os privilégios do criador (postgres), permitindo a inserção na tabela `alunos` que de outra forma seria bloqueada por RLS para o cliente. É seguro porque a função usa `auth.uid()` para garantir que os usuários só possam criar perfis para si mesmos.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Função Adicionada: `public.create_my_aluno_profile(p_arena_id uuid)`

## Security Implications:
- RLS Status: [N/A - Função]
- Policy Changes: [No]
- Auth Requirements: [A função só pode ser executada por usuários autenticados (`authenticated` role).]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo. A execução da função é rápida e ocorre apenas na primeira reserva de um cliente em uma arena.]
*/
create or replace function public.create_my_aluno_profile(p_arena_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aluno_id uuid;
  v_profile_name text;
  v_profile_email text;
begin
  -- Check if an aluno profile already exists for this user in this arena
  select id into v_aluno_id from public.alunos where profile_id = auth.uid() and arena_id = p_arena_id;

  if v_aluno_id is not null then
    return v_aluno_id; -- Return existing ID
  end if;

  -- Get user's name and email from their main profile
  select name, email into v_profile_name, v_profile_email from public.profiles where id = auth.uid();

  -- Insert a new aluno profile
  insert into public.alunos (profile_id, arena_id, name, email, status, plan_name, join_date)
  values (
    auth.uid(),
    p_arena_id,
    v_profile_name,
    v_profile_email,
    'ativo',
    'Avulso',
    CURRENT_DATE
  )
  returning id into v_aluno_id;
  
  return v_aluno_id;
end;
$$;

grant execute on function public.create_my_aluno_profile(uuid) to authenticated;
