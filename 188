/*
# [SECURITY] Set Search Path for check_for_duplicate_reservation
[This operation secures the `check_for_duplicate_reservation` function by setting a fixed `search_path`. This prevents potential hijacking by malicious actors who could create objects in other schemas.]

## Query Description: [This operation modifies the function's security settings. It is a safe, non-destructive change that improves the security posture of your database.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.check_for_duplicate_reservation(uuid, date, time, time, uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.check_for_duplicate_reservation(
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_reserva_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
