/*
# [Function Security] Secure update_aluno_gamification_points
This operation secures the `update_aluno_gamification_points` function by setting a fixed search_path.

## Query Description:
- **Safety:** This operation is safe and does not affect existing data.
- **Impact:** It enhances security by preventing potential search_path hijacking attacks.
- **Reversibility:** This change is reversible by recreating the function without the `search_path` setting.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: `public.update_aluno_gamification_points()`

## Security Implications:
- RLS Status: Not applicable to function definition itself.
- Policy Changes: No.
- Auth Requirements: Admin privileges to alter functions.

## Performance Impact:
- Indexes: None.
- Triggers: The function is used by a trigger, but its performance is not affected.
- Estimated Impact: Negligible.
*/
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points INT;
  v_level_id UUID;
BEGIN
  -- Calcula o total de pontos para o aluno
  SELECT COALESCE(SUM(points), 0)
  INTO v_total_points
  FROM public.gamification_point_transactions
  WHERE aluno_id = COALESCE(new.aluno_id, old.aluno_id);

  -- Encontra o nível correspondente
  SELECT id
  INTO v_level_id
  FROM public.gamification_levels
  WHERE arena_id = COALESCE(new.arena_id, old.arena_id)
    AND points_required &lt;= v_total_points
  ORDER BY points_required DESC
  LIMIT 1;

  -- Atualiza a tabela de alunos com os novos totais
  UPDATE public.alunos
  SET 
    gamification_points = v_total_points,
    gamification_level_id = v_level_id
  WHERE id = COALESCE(new.aluno_id, old.aluno_id);

  RETURN COALESCE(new, old);
END;
$$;
