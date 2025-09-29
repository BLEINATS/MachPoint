/*
# [SECURITY] Harden Function Search Paths
This migration enhances security by explicitly setting the `search_path` for several database functions. This prevents potential vulnerabilities where a malicious user could create objects in a public schema that trick the function into executing unintended code.

## Query Description:
- **`ALTER FUNCTION ... SET search_path`**: This command modifies the configuration of existing functions.
- It does NOT change the logic of the functions, only how they resolve object names (like tables and other functions).
- This is a safe, non-destructive operation that improves security posture.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unsetting the search_path)

## Structure Details:
- Modifies the configuration of the following functions:
  - `public.handle_client_cancellation_final(uuid)`
  - `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Potential for search path hijacking attacks (CVE-2018-1058).

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. May slightly improve performance by providing a more direct path for object resolution.
*/

ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
SET search_path = public, extensions;

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
SET search_path = public, extensions;
