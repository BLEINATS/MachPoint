/*
# [Function Security Hardening]
[This operation secures the `check_duplicate_reservation` function by setting a fixed `search_path`.]

## Query Description: [This change improves security by preventing potential hijacking of the function's execution path. It has no impact on existing data or application functionality.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies the function: `public.check_duplicate_reservation`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.check_duplicate_reservation(
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_reserva_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.reservas
        WHERE quadra_id = p_quadra_id
          AND date = p_date
          AND status <> 'cancelada'
          AND (id <> p_reserva_id OR p_reserva_id IS NULL)
          AND (
            (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
          )
    );
END;
$$;
