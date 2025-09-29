/*
# [SECURITY] Secure check_duplicate_reservation Function
[This operation secures the `check_duplicate_reservation` function by setting a fixed search_path, preventing potential hijacking vulnerabilities, and improves its logic to correctly handle midnight-crossing reservations.]

## Query Description: [This operation redefines an existing database function to enhance security and correctness. It does not alter any user data but improves the function's execution context to prevent security risks and booking conflicts. No backup is required, and the change is reversible by redeploying the previous version of the function.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.check_duplicate_reservation

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible performance impact.]
*/
CREATE OR REPLACE FUNCTION public.check_duplicate_reservation(
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_reserva_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflict_id uuid;
BEGIN
    SELECT r.id INTO v_conflict_id
    FROM public.reservas r
    WHERE
        r.quadra_id = p_quadra_id AND
        r.date = p_date AND
        r.status <> 'cancelada' AND
        (r.id <> p_reserva_id OR p_reserva_id IS NULL) AND
        -- Overlap check that correctly handles midnight-crossing times (e.g., 23:00-00:00)
        (
            (r.start_time, COALESCE(NULLIF(r.end_time, '00:00:00'), '24:00:00')) OVERLAPS
            (p_start_time, COALESCE(NULLIF(p_end_time, '00:00:00'), '24:00:00'))
        )
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'Conflito de horário. Já existe uma reserva para esta quadra neste horário.';
    END IF;
END;
$$;
