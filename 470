/*
          # [Refactor] Secure add_credit_to_aluno function
          This migration refactors the `add_credit_to_aluno` function to make it more secure by setting a specific `search_path`.

          ## Query Description: [This operation will replace an existing database function. It is a non-destructive change designed to improve security by preventing potential search_path hijacking attacks. No data will be modified, and the function's behavior remains the same.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `public.add_credit_to_aluno(uuid, uuid, numeric)`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [None]
          */

DROP FUNCTION IF EXISTS public.add_credit_to_aluno(uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
