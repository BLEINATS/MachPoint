/*
  # [Function Security] Secure add_credit_to_aluno function
  [This operation secures the 'add_credit_to_aluno' function by setting a fixed search_path, preventing potential hijacking attacks.]

  ## Query Description: [This operation redefines an existing function to enhance security. It is a non-destructive change and does not affect existing data. No backup is required.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.add_credit_to_aluno(uuid, uuid, numeric)
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [service_role]
  
  ## Performance Impact:
  - Indexes: [Not Applicable]
  - Triggers: [Not Applicable]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = COALESCE(credit_balance, 0) + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
