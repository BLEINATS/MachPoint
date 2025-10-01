/*
# [SECURITY] Harden Function Search Paths
[This migration hardens the security of several database functions by explicitly setting the `search_path`. This mitigates a class of security vulnerabilities where a malicious user could potentially create objects in other schemas to hijack function execution.]

## Query Description: [This operation modifies existing database functions to improve security. It is a non-destructive change and does not affect application logic or data. No backup is required, and the change is reversible by deploying a previous version of the function.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies function: `public.add_gamification_points`
- Modifies function: `public.add_credit_to_aluno`

## Security Implications:
- RLS Status: [No Change]
- Policy Changes: [No]
- Auth Requirements: [No Change]
- Mitigates `search_path` hijacking vulnerabilities.

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [Negligible. This change has no noticeable impact on performance.]
*/

-- Harden add_gamification_points
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_arena_id uuid;
    v_type gamification_point_transaction_type;
BEGIN
    -- Get arena_id from aluno
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Determine transaction type
    IF p_description ILIKE 'Resgate:%' THEN
        v_type := 'reward_redemption';
    ELSIF p_description ILIKE 'Conquista:%' THEN
        v_type := 'achievement_unlocked';
    ELSE
        v_type := 'manual_adjustment';
    END IF;

    -- Insert transaction
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_type, p_description);

END;
$$;

-- Harden add_credit_to_aluno
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
