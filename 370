/*
# [Fix] Corrige a função `check_duplicate_reservation`
[Este script corrige um erro de migração ao recriar a função `check_duplicate_reservation` com o tipo de retorno correto, garantindo que a verificação de reservas duplicadas funcione como esperado.]

## Query Description: [This operation safely replaces a database function without data loss. It first removes the old version and then creates the corrected one, ensuring the reservation conflict check works properly.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function `check_duplicate_reservation` will be dropped and recreated.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

DROP FUNCTION IF EXISTS public.check_duplicate_reservation(uuid, date, time without time zone, time without time zone, uuid);

CREATE OR REPLACE FUNCTION public.check_duplicate_reservation(
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_reserva_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.reservas
        WHERE
            quadra_id = p_quadra_id AND
            date = p_date AND
            (id <> p_reserva_id OR p_reserva_id IS NULL) AND
            status <> 'cancelada' AND
            (
                (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
            )
    );
END;
$$;
