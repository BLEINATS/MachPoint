/*
# [Security] Harden `add_credit_to_aluno` function

This script enhances the security of the `add_credit_to_aluno` function by explicitly setting its `search_path`. This is a best practice that prevents potential security vulnerabilities by ensuring the function only looks for objects (like tables) in the specified schemas, in this case, `public`.

## Query Description:
- **CREATE OR REPLACE FUNCTION**: Recreates the function with the same logic but adds `SET search_path = public`.
- This change does not alter the function's behavior but improves its security posture.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by reverting the change)

## Structure Details:
- Function `add_credit_to_aluno`

## Security Implications:
- RLS Status: Not affected.
- Policy Changes: No.
- Auth Requirements: None.
- This change mitigates a "Function Search Path Mutable" warning from the Supabase security advisor.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
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
