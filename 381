/*
# [Fix Function Search Path]
Este script corrige um aviso de segurança na função `add_credit_to_aluno`, definindo um `search_path` explícito. Isso previne potenciais vulnerabilidades de segurança (hijacking) sem alterar o comportamento da função.

## Query Description:
- **Impacto:** Baixo. A operação não afeta dados existentes e apenas melhora a segurança da função.
- **Riscos:** Mínimos. A função é recriada com a mesma lógica, apenas com uma configuração de segurança adicional.
- **Precauções:** Nenhuma precaução especial é necessária.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (removendo a configuração `search_path`)

## Structure Details:
- **Função Afetada:** `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- **RLS Status:** Não aplicável a funções.
- **Policy Changes:** Não.
- **Auth Requirements:** A execução da função depende das permissões do usuário que a chama.

## Performance Impact:
- **Indexes:** Nenhum.
- **Triggers:** Nenhum.
- **Estimated Impact:** Nenhum impacto de performance esperado.
*/

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
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;
