/*
  # [SECURITY] Set search_path for critical functions
  This migration improves security by explicitly setting the `search_path` for several functions, mitigating the risk of search path hijacking attacks as flagged by Supabase security advisories.

  ## Query Description:
  - This operation alters existing database functions to make them more secure.
  - It does not change the logic or behavior of the functions.
  - There is no impact on existing data.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by unsetting the parameter)

  ## Structure Details:
  - Functions affected:
    - `handle_client_cancellation_final(p_reserva_id uuid)`
    - `add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Unchanged
  - Mitigates: "Function Search Path Mutable" warning.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/

ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
SET search_path = 'public';

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
SET search_path = 'public';
