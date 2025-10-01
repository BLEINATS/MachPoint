/*
# [Function] `cancel_booking_as_client` (v2)
[This function allows an authenticated client to cancel their own reservation securely.]

## Query Description: [This operation corrects the security model of the `cancel_booking_as_client` function. By changing it to `SECURITY INVOKER`, the function will run with the permissions of the user calling it, ensuring `auth.uid()` correctly identifies the user and allows them to cancel their own reservations.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[
  - Function: `public.cancel_booking_as_client(p_reserva_id uuid)`
]

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Low]
*/
-- Drop the old function if it exists to ensure a clean state
drop function if exists public.cancel_booking_as_client(uuid);

-- Recreate the function with the correct SECURITY INVOKER property
create or replace function public.cancel_booking_as_client(p_reserva_id uuid)
returns void
language plpgsql
security invoker -- IMPORTANT: Runs with the permissions of the user calling the function
set search_path = public
as $$
declare
  target_reserva public.reservas;
begin
  -- Get the reservation details
  select *
  into target_reserva
  from public.reservas
  where id = p_reserva_id;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  -- Check if the authenticated user is the one who made the reservation
  -- This check is now redundant if RLS is correctly set up, but adds a layer of safety.
  if target_reserva.profile_id is null or target_reserva.profile_id <> auth.uid() then
    -- Also check if the user is an admin of the arena for override
    if not exists (
      select 1
      from public.arenas
      where id = target_reserva.arena_id and owner_id = auth.uid()
    ) then
      raise exception 'Permissão negada: você não é o dono desta reserva ou administrador da arena.';
    end if;
  end if;

  -- If checks pass, update the reservation status.
  -- The RLS policy on the 'reservas' table will enforce the final permission check.
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;
end;
$$;

-- Grant permission to authenticated users
grant execute on function public.cancel_booking_as_client(uuid) to authenticated;
