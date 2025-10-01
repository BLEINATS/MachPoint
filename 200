-- =================================================================
-- ||               SECURE HANDLE NEW USER PROFILE                ||
-- =================================================================
-- || Descrição:                                                  ||
-- || Esta migração recria a função e o gatilho que lidam com a   ||
-- || criação de perfis para novos usuários, garantindo que o     ||
-- || 'search_path' esteja definido para maior segurança.         ||
-- =================================================================

-- Recria a função para criar um perfil para um novo usuário
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role
  );
  
  -- Se o usuário for um administrador, também cria uma arena para ele
  if (new.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' then
    insert into public.arenas (owner_id, name)
    values (new.id, new.raw_user_meta_data->>'name');
  end if;
  
  return new;
end;
$$;

-- Recria o gatilho para chamar a função quando um novo usuário é criado
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
