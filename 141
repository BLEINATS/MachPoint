/*
# [SECURITY] Harden Database Functions
This migration enhances security by setting a fixed `search_path` for several database functions. This mitigates the risk of unauthorized code execution (trojan horse attacks) by preventing malicious users from creating objects in schemas they can write to (like `public`) that could be executed by these functions.

## Query Description:
- This operation redefines existing functions to include `SET search_path = ''`.
- It does NOT alter the core logic of the functions.
- This is a safe, non-destructive security improvement.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by redeploying the previous function versions)

## Structure Details:
- Functions affected:
  - `add_credit_to_aluno(uuid, uuid, numeric)`
  - `add_gamification_points(uuid, int, text)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Unchanged
- Mitigates CVE-2018-1058 by explicitly setting the search path.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.alunos
  SET credit_balance = credit_balance + amount_to_add
  WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.gamification_point_transactions (aluno_id, arena_id, points, type, description)
    SELECT id, arena_id, p_points_to_add, 'manual_adjustment', p_description
    FROM public.alunos
    WHERE id = p_aluno_id;
END;
$$;
