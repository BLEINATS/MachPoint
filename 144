/*
          # [Structural] Recriar a função create_my_aluno_profile
          [Este script recria a função `create_my_aluno_profile` que é essencial para que novos clientes possam se registrar na arena e ter seus perfis de aluno criados automaticamente. A função anterior foi removida ou corrompida, causando erros.]

          ## Query Description: [Este script é seguro. Ele apenas define uma nova função no banco de dados e não afeta nenhum dado existente. A função garante que apenas usuários autenticados possam criar um perfil de aluno para si mesmos, associado à arena correta.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `public.create_my_aluno_profile`
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: A função exige que o chamador esteja autenticado (`auth.uid()`).
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Nenhum impacto de performance esperado.
          */

CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(
    p_arena_id uuid,
    p_name text,
    p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
BEGIN
    -- Insere o perfil do aluno na tabela 'alunos'
    INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, join_date, plan_name)
    VALUES (v_profile_id, p_arena_id, p_name, p_phone, 'ativo', NOW(), 'Avulso')
    RETURNING id INTO v_aluno_id;

    -- Adiciona a associação na tabela 'arena_memberships'
    INSERT INTO public.arena_memberships (profile_id, arena_id)
    VALUES (v_profile_id, p_arena_id)
    ON CONFLICT (profile_id, arena_id) DO NOTHING;
    
    RETURN v_aluno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_my_aluno_profile(uuid, text, text) TO authenticated;
