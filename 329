/*
          # [Fix] Recriar Tipo de Transação de Gamificação e Função Dependente
          [Este script corrige um erro de tipo de dado ausente, recriando o ENUM 'gamification_point_transaction_type' e a função 'add_gamification_points' que o utiliza.]

          ## Query Description: [Este script primeiro cria um tipo de dado personalizado para transações de gamificação e, em seguida, recria a função que adiciona pontos para usar esse tipo. Esta operação é segura e não afeta dados existentes, apenas corrige a estrutura do banco de dados para permitir que as migrações continuem.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Cria o tipo ENUM 'gamification_point_transaction_type'.
          - Recria a função 'add_gamification_points' para usar o novo tipo.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [admin]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

-- Step 1: Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text);

-- Step 2: Create the ENUM type if it doesn't exist
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

-- Step 3: Recreate the function with the correct type
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text,
    p_transaction_type public.gamification_point_transaction_type DEFAULT 'manual_adjustment'::public.gamification_point_transaction_type,
    p_related_reservation_id uuid DEFAULT NULL,
    p_related_achievement_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_arena_id uuid;
    v_new_total_points integer;
BEGIN
    -- Get the arena_id from the aluno
    SELECT arena_id INTO v_arena_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Insert the transaction
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, related_reservation_id, related_achievement_id)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, p_transaction_type, p_description, p_related_reservation_id, p_related_achievement_id);

    -- Update the total points on the alunos table
    UPDATE public.alunos
    SET gamification_points = COALESCE(gamification_points, 0) + p_points_to_add
    WHERE id = p_aluno_id
    RETURNING gamification_points INTO v_new_total_points;

    -- Update the level based on the new total points
    UPDATE public.alunos
    SET gamification_level_id = (
        SELECT id
        FROM public.gamification_levels
        WHERE arena_id = v_arena_id
          AND points_required <= v_new_total_points
        ORDER BY points_required DESC
        LIMIT 1
    )
    WHERE id = p_aluno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text, public.gamification_point_transaction_type, uuid, uuid) TO authenticated;
