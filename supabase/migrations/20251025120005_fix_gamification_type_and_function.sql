/*
# [Fix] Create Gamification Type and Recreate Function
[This script fixes a migration error by creating the necessary 'gamification_point_transaction_type' and then recreating the function that depends on it.]

## Query Description: [This operation defines a new data type for gamification transactions and updates the related table and function. It is a structural change and should be safe to apply, as it corrects a missing dependency.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Creates ENUM type 'gamification_point_transaction_type'.
- Alters 'gamification_point_transactions' table to use the new type.
- Recreates the 'add_gamification_points' function.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact.]
*/

-- Step 1: Create the ENUM type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gamification_point_transaction_type') THEN
        CREATE TYPE public.gamification_point_transaction_type AS ENUM (
            'reservation_completed',
            'manual_adjustment',
            'achievement_unlocked',
            'reward_redemption'
        );
    END IF;
END$$;

-- Step 2: Alter the table to use the new type.
-- This assumes the 'type' column exists and is of a text-compatible type.
ALTER TABLE public.gamification_point_transactions
ALTER COLUMN type TYPE public.gamification_point_transaction_type USING type::text::gamification_point_transaction_type;

-- Step 3: Recreate the function that depends on this type.
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void AS $$
DECLARE
    v_arena_id uuid;
    v_type gamification_point_transaction_type;
BEGIN
    -- Get arena_id from aluno
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    -- Determine transaction type based on description
    IF p_description ILIKE 'Resgate:%' THEN
        v_type := 'reward_redemption';
    ELSIF p_description ILIKE 'Conquista:%' THEN
        v_type := 'achievement_unlocked';
    ELSIF p_description ILIKE 'Reserva realizada%' THEN
        v_type := 'reservation_completed';
    ELSE
        v_type := 'manual_adjustment';
    END IF;

    -- Insert the transaction
    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_type, p_description);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
