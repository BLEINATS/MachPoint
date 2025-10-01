/*
# [Refactor] Sistema de Crédito para Clientes
[Este script refatora o sistema de crédito para associá-lo diretamente aos registros de 'alunos' (clientes), em vez de 'profiles' (usuários), tornando-o independente da necessidade de um cliente ter uma conta de usuário.]

## Query Description: [Esta operação adiciona uma coluna `credit_balance` à tabela `alunos` e uma coluna `aluno_id` à tabela `credit_transactions`. Ela também cria uma nova função `add_credit_to_aluno` para gerenciar o saldo de forma segura. Nenhuma perda de dados está prevista.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [true]
- Reversible: [false]
*/

-- Passo 1: Adicionar saldo de crédito à tabela de alunos
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS credit_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Passo 2: Modificar a tabela de transações de crédito para incluir referência ao aluno
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL;

-- Passo 3: Criar a nova função RPC para adicionar crédito ao aluno de forma segura
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
  aluno_arena_id uuid;
BEGIN
  -- Verifica se o chamador é o dono da arena
  SELECT EXISTS (
    SELECT 1 FROM arenas WHERE id = arena_id_to_check AND owner_id = auth.uid()
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Permissão negada: Você não é o dono desta arena.';
  END IF;

  -- Verifica se o aluno pertence à arena especificada
  SELECT arena_id FROM alunos WHERE id = aluno_id_to_update INTO aluno_arena_id;

  IF aluno_arena_id IS NULL OR aluno_arena_id <> arena_id_to_check THEN
    RAISE EXCEPTION 'Permissão negada: Aluno não pertence à arena especificada.';
  END IF;

  -- Atualiza o saldo de crédito do aluno
  UPDATE public.alunos
  SET credit_balance = credit_balance + amount_to_add
  WHERE id = aluno_id_to_update;
END;
$$;
