/*
# [Security Hardening] Secure add_gamification_points function
This operation secures the `add_gamification_points` function by explicitly setting the `search_path`.

## Query Description: [This operation modifies a database function to enhance security by setting a fixed search_path. It prevents potential hijacking by malicious schemas. This change is non-destructive and should not impact existing data or application functionality.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.add_gamification_points`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_arena_id uuid;
    v_transaction_type gamification_point_transaction_type;
BEGIN
    -- Get the arena_id from the aluno profile
    SELECT arena_id INTO v_arena_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;
    
    -- Determine transaction type based on points
    IF p_points_to_add > 0 THEN
        v_transaction_type := 'manual_credit';
    ELSE
        v_transaction_type := 'manual_debit';
    END IF;

    -- Insert the transaction
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_transaction_type, p_description);

END;
$$;
