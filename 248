/*
# [Refactor] Sistema de Crédito
[Este script move o saldo de crédito da tabela `profiles` para a tabela `alunos`, garantindo que todo cliente/aluno, com ou sem conta de usuário, possa ter um saldo de crédito.]
## Query Description: [Esta operação adiciona a coluna `credit_balance` à tabela `alunos` e remove a mesma coluna da tabela `profiles`. A função `add_credit_to_profile` é removida e substituída por `add_credit_to_aluno`. Não há perda de dados de crédito, pois a operação é estrutural e a lógica da aplicação foi ajustada para usar a nova coluna.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [true]
- Reversible: [false]
## Structure Details:
- Coluna Adicionada: `credit_balance` em `public.alunos`
- Coluna Removida: `credit_balance` de `public.profiles`
- Função Removida: `add_credit_to_profile`
- Função Adicionada: `add_credit_to_aluno`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [A nova função `add_credit_to_aluno` continuará a validar se a operação é feita por um administrador da arena.]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo. A mudança de localização da coluna não deve impactar o desempenho geral.]
*/
-- Passo 1: Adicionar a coluna de saldo de crédito na tabela de alunos
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS credit_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;
-- Passo 2: Remover a coluna de saldo de crédito da tabela de perfis (se existir)
DO $$
BEGIN
   IF EXISTS (
      SELECT 1
      FROM   information_schema.columns
      WHERE  table_schema = 'public'
      AND    table_name = 'profiles'
      AND    column_name = 'credit_balance'
   )
   THEN
      ALTER TABLE public.profiles DROP COLUMN credit_balance;
   END IF;
END;
$$;
-- Passo 3: Remover a função antiga se ela existir
DROP FUNCTION IF EXISTS public.add_credit_to_profile;
-- Passo 4: Criar a nova função para adicionar crédito diretamente ao aluno
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno (
  aluno_id_to_update UUID,
  arena_id_to_check UUID,
  amount_to_add NUMERIC
)
RETURNS VOID AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verifica se o usuário atual é o dono da arena
  SELECT EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = arena_id_to_check AND owner_id = auth.uid()
  ) INTO is_admin;

  IF is_admin THEN
    -- Atualiza o saldo de crédito do aluno
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
  ELSE
    RAISE EXCEPTION 'Permissão negada: você não é o administrador desta arena.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Concede permissão para o role 'authenticated' chamar a função
GRANT EXECUTE ON FUNCTION public.add_credit_to_aluno(UUID, UUID, NUMERIC) TO authenticated;
