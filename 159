/*
  # [SECURITY] Set Search Path for Functions
  This migration enhances security by explicitly setting the `search_path` for several functions. This prevents potential hijacking attacks by ensuring that the functions resolve objects (tables, types, etc.) from the intended `public` schema first.

  ## Query Description:
  - **Safety:** This is a safe, non-destructive operation.
  - **Impact:** It modifies the function's configuration without changing its logic or affecting any data. By setting a fixed `search_path`, we improve the predictability and security of function execution.
  - **Risk:** The risk is extremely low. The only potential issue would be if a function intentionally relied on an object from a schema other than `public`, which is not the case here.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by altering the function again to remove the setting)

  ## Structure Details:
  - `handle_client_cancellation_final(uuid)`
  - `add_credit_to_aluno(uuid, uuid, numeric)`
  - `add_gamification_points(uuid, integer, text)`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None
  - Mitigates: Search Path Hijacking (CWE-426, CWE-427)

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. May slightly improve performance by providing a more direct path for object resolution.
*/

ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
SET search_path = 'public';

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
SET search_path = 'public';

ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
SET search_path = 'public';
