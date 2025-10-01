/*
# [Fix] Corrigir Permissões da Função de Criação de Perfil de Aluno
[Este script corrige a função `create_my_aluno_profile` para que ela possa ser executada corretamente por um usuário cliente, resolvendo o erro de violação de RLS (Row Level Security).]

## Query Description: [Esta operação altera a função existente para executá-la com privilégios de `SECURITY DEFINER`. Isso permite que a função insira um registro na tabela `alunos` em nome do cliente, contornando a política de RLS que impede o cliente de fazer isso diretamente. A função continua segura, pois só pode criar um registro para o usuário que a está chamando (`auth.uid()`).]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Função Modificada: `public.create_my_aluno_profile`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [A função agora é `SECURITY DEFINER`, o que significa que ela é executada com as permissões do seu criador (um administrador), mas a lógica interna garante que ela só afete os dados do usuário autenticado, mantendo a segurança.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Nenhum. Apenas corrige um problema de permissão.]
*/

create or replace function public.create_my_aluno_profile(p_arena_id uuid)
returns uuid
language plpgsql
security definer -- Adiciona a permissão necessária para a função ser executada corretamente.
as $$
declare
  v_profile public.profiles;
  v_aluno_id uuid;
begin
  -- Get the profile of the currently authenticated user
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile is null then
    raise exception 'Perfil de usuário não encontrado.';
  end if;

  -- Check if an aluno profile already exists for this user in this arena
  select id into v_aluno_id from public.alunos where profile_id = auth.uid() and arena_id = p_arena_id;
  if v_aluno_id is not null then
    return v_aluno_id;
  end if;

  -- Insert a new aluno record
  insert into public.alunos (profile_id, arena_id, name, email, status, plan_name, join_date)
  values (auth.uid(), p_arena_id, v_profile.name, v_profile.email, 'ativo', 'Avulso', now())
  returning id into v_aluno_id;

  return v_aluno_id;
end;
$$;
