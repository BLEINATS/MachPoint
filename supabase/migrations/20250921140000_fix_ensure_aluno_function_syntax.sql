/*
# [Bugfix] Correção de Sintaxe na Função de Cadastro
[Este script corrige um erro de sintaxe na função `ensure_aluno_for_profile` que impedia a aplicação da migração anterior. A linha que causava o problema foi removida para garantir a compatibilidade.]
## Query Description: [Esta operação substitui a função `ensure_aluno_for_profile` por uma versão com a sintaxe corrigida. A funcionalidade é a mesma da versão anterior, mas sem o erro que bloqueava a execução.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]
## Structure Details:
- Função Modificada: `public.ensure_aluno_for_profile`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [A função continua usando SECURITY DEFINER para operar de forma segura.]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/

CREATE OR REPLACE FUNCTION public.ensure_aluno_for_profile(
    p_profile_id UUID,
    p_arena_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT
)
RETURNS SETOF public.alunos
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_aluno_record public.alunos;
BEGIN
    -- First, try to find an existing aluno record for this profile in this arena
    SELECT * INTO v_aluno_record
    FROM public.alunos a
    WHERE a.profile_id = p_profile_id AND a.arena_id = p_arena_id;

    -- If no record is found, create one
    IF v_aluno_record IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, plan_name, join_date)
        VALUES (p_profile_id, p_arena_id, p_name, p_email, p_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING * INTO v_aluno_record;
    END IF;

    -- Return the found or newly created record
    RETURN NEXT v_aluno_record;
    RETURN;
END;
$$;
