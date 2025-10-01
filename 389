/*
# [SECURITY] Set Search Path for Core Functions
This migration enhances security by explicitly setting the `search_path` for several critical database functions. This prevents potential hijacking attacks by ensuring that the functions only search for objects within trusted schemas.

## Query Description:
- **Safety:** This is a safe, non-destructive operation.
- **Impact:** No data will be changed. Function behavior remains the same, but becomes more secure.
- **Risk:** Low. This is a standard security best practice.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function again to remove the `search_path` setting)

## Structure Details:
- **Altered Functions:**
  - `public.handle_client_cancellation_final(uuid)`
  - `public.add_gamification_points(uuid, integer, text)`
  - `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Unchanged
- Mitigates: `search_path` hijacking vulnerabilities.
*/

ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
SET search_path = public, extensions;

ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
SET search_path = public, extensions;

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
SET search_path = public, extensions;
