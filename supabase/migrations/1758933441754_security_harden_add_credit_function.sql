/*
# [SECURITY] Set Search Path for add_credit_to_aluno
This operation sets a secure search_path for the `add_credit_to_aluno` function to prevent potential hijacking attacks.

## Query Description: [This operation modifies a database function to enhance security by explicitly setting the `search_path`. It does not alter the function's logic or impact existing data. This is a safe and recommended security practice.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function being affected: `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact.]
*/
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
