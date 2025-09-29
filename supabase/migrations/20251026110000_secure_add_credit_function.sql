/*
  # [Secure Function] add_credit_to_aluno
  [This operation secures the 'add_credit_to_aluno' function by setting a fixed search_path, preventing potential hijacking attacks.]

  ## Query Description: [This script will safely drop and recreate the 'add_credit_to_aluno' function to enhance its security by setting a non-mutable search path. This is a preventative security measure and does not change the function's behavior or impact any existing data.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.add_credit_to_aluno
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [authenticated]
  - Mitigates: [CVE-2018-1058 - Search Path Hijacking]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [Negligible. This is a definitional change with no runtime performance impact.]
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.add_credit_to_aluno(uuid, uuid, numeric);

-- Recreate the function with security definer and search_path
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
