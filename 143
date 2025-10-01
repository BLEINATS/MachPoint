/*
# [SECURITY] Set Search Path for Functions
[This operation sets the search_path for database functions to mitigate potential security vulnerabilities, as recommended by Supabase security advisories.]

## Query Description: [This script alters existing functions to explicitly set their search_path. This is a security best practice that prevents potential hijacking of function execution by malicious actors who might create objects in other schemas. It does not change the function's logic or impact data.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[
  - public.add_credit_to_aluno(uuid, uuid, numeric)
  - public.is_arena_admin(uuid)
]

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [This change hardens function security by restricting the search path.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact.]
*/

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric) SET search_path = public;

ALTER FUNCTION public.is_arena_admin(p_arena_id uuid) SET search_path = public;
