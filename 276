/*
          # [Function] Fix Client Cancellation with SECURITY INVOKER
          [This operation creates a new, safer function for clients to cancel their reservations, relying on Row-Level Security (RLS) policies.]

          ## Query Description: [This operation drops the previous cancellation function and creates a new one named `cancel_booking_as_client`. This new function uses `SECURITY INVOKER`, meaning it runs with the permissions of the user calling it. This is a safer pattern that relies on your existing RLS policies to ensure a user can only cancel their own reservations. This should definitively resolve any permission or cache issues.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops function: public.client_cancel_reservation_by_id_v2
          - Creates function: public.cancel_booking_as_client(p_reserva_id uuid)
          
          ## Security Implications:
          - RLS Status: [Relies on existing RLS]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated User]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low]
          */
drop function if exists public.client_cancel_reservation_by_id_v2(p_reserva_id uuid);

create or replace function public.cancel_booking_as_client(p_reserva_id uuid)
returns void
language sql
security invoker -- Runs with the permissions of the user calling it.
as $$
  update public.reservas
  set status = 'cancelada'
  where id = p_reserva_id;
$$;

grant execute on function public.cancel_booking_as_client(p_reserva_id uuid) to authenticated;
