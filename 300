-- Remove a função antiga, se existir, para evitar conflitos.
DROP FUNCTION IF EXISTS public.add_gamification_points(uuid, integer, text);

-- Recria a função com a lógica correta.
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Importante: será executado com as permissões do admin logado.
AS $$
DECLARE
  v_arena_id uuid;
BEGIN
  -- Garante que apenas o admin da arena correta possa executar.
  SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

  IF v_arena_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  IF NOT is_arena_admin(v_arena_id) THEN
    RAISE EXCEPTION 'Apenas o administrador da arena pode ajustar pontos.';
  END IF;

  -- Atualiza o saldo de pontos do aluno.
  UPDATE public.alunos
  SET gamification_points = gamification_points + p_points_to_add
  WHERE id = p_aluno_id;

  -- Registra a transação no histórico.
  INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description, created_by)
  VALUES (v_arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description, auth.uid());
END;
$$;

-- Garante que usuários autenticados (como o admin) possam executar a função.
GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, integer, text) TO authenticated;
