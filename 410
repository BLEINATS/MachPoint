/*
          # [Fix] Corrige o tipo de retorno da função `check_duplicate_reservation`
          [Este script corrige um erro de migração que impede a alteração de uma função existente. A função antiga é removida e recriada com a assinatura e o tipo de retorno corretos, garantindo que a verificação de reservas duplicadas funcione como esperado.]

          ## Query Description: [Esta operação remove e recria uma função do banco de dados. Não há impacto direto nos dados existentes, mas é um passo necessário para corrigir a lógica de verificação de conflitos de horário. A função antiga está impedindo atualizações.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Function `check_duplicate_reservation`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Remove a função antiga com a assinatura incorreta
DROP FUNCTION IF EXISTS public.check_duplicate_reservation(uuid, date, time without time zone, time without time zone, uuid);

-- Recria a função com a lógica e o tipo de retorno corretos
CREATE OR REPLACE FUNCTION public.check_duplicate_reservation(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_reserva_id_to_exclude uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflict_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.reservas r
        WHERE
            r.arena_id = p_arena_id AND
            r.quadra_id = p_quadra_id AND
            r.date = p_date AND
            r.status <> 'cancelada' AND
            (p_reserva_id_to_exclude IS NULL OR r.id <> p_reserva_id_to_exclude) AND
            (r.start_time, r.end_time) OVERLAPS (p_start_time, p_end_time)
    ) INTO v_conflict_exists;

    RETURN v_conflict_exists;
END;
$$;
