/*
          # [Structural] Recria a função create_my_aluno_profile
          [Esta operação recria a função 'create_my_aluno_profile' que estava ausente, causando erros em outras migrações. A função é essencial para que um cliente que segue uma arena possa criar seu próprio perfil de 'aluno' (cliente) dentro daquela arena, permitindo que ele faça reservas.]

          ## Query Description: [Cria ou substitui a função para garantir que ela exista e esteja correta. A operação não afeta dados existentes e é segura de ser executada. Ela corrige um erro de "função não existe" que impedia a aplicação de outras migrações.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Function: public.create_my_aluno_profile(p_arena_id uuid)
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: authenticated
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_name text;
  v_email text;
  v_phone text;
BEGIN
  -- Obter dados do perfil do usuário autenticado
  SELECT name, email, phone
  INTO v_name, v_email, v_phone
  FROM public.profiles
  WHERE id = v_profile_id;

  -- Inserir na tabela de alunos se não existir um perfil para essa arena
  INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
  VALUES (p_arena_id, v_profile_id, v_name, v_email, v_phone, 'ativo', 'Avulso', NOW())
  ON CONFLICT (arena_id, profile_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_my_aluno_profile(uuid) TO authenticated;
