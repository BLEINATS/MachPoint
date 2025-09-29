/*
# [Security Hardening] Secure add_credit_to_aluno function
[This operation secures the `add_credit_to_aluno` function by explicitly setting its search path and ensuring it runs with definer privileges, mitigating potential security risks.]

## Query Description: [This operation will redefine the `add_credit_to_aluno` function to enhance security. It ensures that the function operates within a safe and predictable context. There is no risk to existing data, but it is a critical update for system integrity.]
          
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
          
## Structure Details:
- Function: `public.add_credit_to_aluno(uuid, uuid, numeric)`
          
## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges for the target arena]
          
## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

-- Drop the existing function if it exists, to avoid conflicts
DROP FUNCTION IF EXISTS public.add_credit_to_aluno(uuid, uuid, numeric);

-- Recreate the function with enhanced security
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
    -- Check if the calling user is an admin of the arena
    IF NOT is_arena_admin(arena_id_to_check) THEN
        RAISE EXCEPTION 'Permissão negada: você não é administrador desta arena.';
    END IF;

    UPDATE public.alunos
    SET credit_balance = COALESCE(credit_balance, 0) + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.add_credit_to_aluno(uuid, uuid, numeric) TO authenticated;
