/*
# [SECURITY] Set Search Path for Functions
[Description of what this operation does]
Sets the `search_path` for the `add_credit_to_aluno` and `is_arena_admin` functions to mitigate security risks (CWE-426).

## Query Description: [This operation improves security by explicitly setting the function's search path, preventing potential hijacking by malicious schemas. It does not alter data or functionality.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[
  - Function: add_credit_to_aluno(uuid, uuid, numeric)
  - Function: is_arena_admin(uuid)
]

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

-- This assumes the function signature. If it fails, the arguments might be different.
ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric) SET search_path = public;

-- This assumes the function signature. If it fails, the arguments might be different.
ALTER FUNCTION public.is_arena_admin(p_user_id uuid) SET search_path = public;
