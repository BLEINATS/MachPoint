/*
          # [Function: client_cancel_reservation_by_id_v4]
          [This function allows a client to cancel their own reservation by providing the reservation ID. It correctly identifies the calling user even inside a SECURITY DEFINER context.]

          ## Query Description: [This operation creates a new, more secure database function `client_cancel_reservation_by_id_v4`. It fixes a critical permission bug by using `auth.jwt()` to correctly identify the user calling the function. This is the definitive fix for the cancellation permission errors.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [Function: public.client_cancel_reservation_by_id_v4(p_reserva_id uuid)]
          
          ## Security Implications:
          - RLS Status: [N/A for function, but interacts with RLS on tables]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low]
          */
create or replace function public.client_cancel_reservation_by_id_v4(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva public.reservas;
  v_caller_id uuid;
begin
  -- Get the current user's ID from the JWT
  v_caller_id := (auth.jwt()->>'sub')::uuid;

  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Find the reservation and check ownership
  select * into v_reserva from public.reservas where id = p_reserva_id;

  if not found then
    raise exception 'Reservation not found';
  end if;

  -- Check if the current user is the owner of the reservation
  if v_reserva.profile_id != v_caller_id then
    raise exception 'Permission denied: You are not the owner of this reservation.';
  end if;

  -- Update the reservation status to 'cancelada'
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;
end;
$$;

grant execute on function public.client_cancel_reservation_by_id_v4(uuid) to authenticated;
