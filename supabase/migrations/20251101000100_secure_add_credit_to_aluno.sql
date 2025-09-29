/*
  # [Operation Name]
  [This operation secures the 'add_credit_to_aluno' function by setting a fixed search_path, mitigating a security advisory.]
  ## Query Description: [This script safely drops and recreates a database function to apply security best practices. It modifies the function's definition to prevent potential search_path hijacking vulnerabilities, without altering its core logic or impacting existing data. This is a low-risk, preventative security enhancement.]
  ## Metadata:
  - Schema-Category: 'Security'
  - Impact-Level: 'Low'
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'add_credit_to_aluno' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. This change only affects the function's security context.
*/
DROP FUNCTION IF EXISTS public.add_credit_to_aluno(uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the aluno belongs to the specified arena
    IF NOT EXISTS (
        SELECT 1
        FROM public.alunos
        WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check
    ) THEN
        RAISE EXCEPTION 'Aluno não pertence à arena especificada.';
    END IF;

    -- Update the credit balance
    UPDATE public.alunos
    SET credit_balance = COALESCE(credit_balance, 0) + amount_to_add
    WHERE id = aluno_id_to_update;
END;
$$;
