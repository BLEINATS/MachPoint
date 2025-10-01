/*
# [Refactor] Secure add_credit_to_aluno function
[This operation secures the `add_credit_to_aluno` function by setting a fixed search path, mitigating potential security risks related to search path hijacking.]

## Query Description: [This is a safe, non-destructive operation that enhances security by explicitly setting the function's search path. It does not alter data or table structures.]

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Authenticated]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.alunos
  SET credit_balance = credit_balance + amount_to_add
  WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
