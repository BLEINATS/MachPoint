/*
# [Fix] Função para Adicionar Crédito de Forma Segura
[Cria uma função de banco de dados (RPC) para adicionar crédito ao perfil de um usuário, contornando as políticas de RLS de forma segura.]
## Query Description: [Esta operação cria uma função `add_credit_to_profile` que permite a um administrador de arena adicionar crédito a um cliente de sua própria arena. A função é `SECURITY DEFINER`, permitindo que ela modifique a tabela `profiles`, mas contém verificações internas para garantir que apenas administradores autorizados possam chamar a função para clientes válidos, prevenindo acesso não autorizado.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Função Adicionada: `public.add_credit_to_profile(uuid, uuid, numeric)`
## Security Implications:
- RLS Status: [N/A - Function]
- Policy Changes: [No]
- Auth Requirements: [A função verifica internamente se o chamador é o `owner_id` da arena especificada.]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo. A execução da função é rápida e só ocorre durante o cancelamento de reservas.]
*/
create or replace function add_credit_to_profile(
    profile_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
returns void
language plpgsql
security definer
as $$
declare
  is_admin boolean;
  is_client_of_arena boolean;
begin
  -- Verifica se o chamador é o administrador da arena especificada
  select exists (
    select 1 from public.arenas
    where id = arena_id_to_check and owner_id = auth.uid()
  ) into is_admin;
  if not is_admin then
    raise exception 'Permissão negada: Você não é o administrador desta arena.';
  end if;
  -- Verifica se o perfil a ser atualizado é um cliente da arena (seja na tabela de alunos ou de reservas)
  select exists (
    select 1 from public.alunos
    where profile_id = profile_id_to_update and arena_id = arena_id_to_check
  ) into is_client_of_arena;
  if not is_client_of_arena then
     select exists (
        select 1 from public.reservas
        where profile_id = profile_id_to_update and arena_id = arena_id_to_check
    ) into is_client_of_arena;
  end if;
  
  if not is_client_of_arena then
    raise exception 'Permissão negada: O usuário especificado não é um cliente desta arena.';
  end if;
  -- Realiza a atualização do saldo de crédito
  update public.profiles
  set credit_balance = credit_balance + amount_to_add
  where id = profile_id_to_update;
end;
$$;
