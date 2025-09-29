/*
  # [SECURITY] Fix Mutable Function Search Path

  [This migration enhances security by setting a fixed `search_path` for database functions, mitigating potential risks associated with mutable search paths. This is part of a series of updates to address security advisories.]

  ## Query Description: [This operation modifies the metadata of existing database functions to improve security. It does not alter the function's logic or affect any data. It's a safe, non-destructive update.]
  
  ## Metadata:
  - Schema-Category: ["Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Modifies `handle_client_cancellation_final(uuid)`
  - Modifies `add_credit_to_aluno(uuid, uuid, numeric)`
  
  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [No Change]
  
  ## Performance Impact:
  - Indexes: [No Change]
  - Triggers: [No Change]
  - Estimated Impact: [None]
*/
ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid) SET search_path = "$user", public, extensions;

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric) SET search_path = "$user", public, extensions;
