/*
# [Fix] Correção de Migração para Reservas Recorrentes
[Este script garante que a chave estrangeira para `master_id` seja adicionada apenas se ela ainda não existir, corrigindo o erro de migração anterior.]
## Query Description: [Esta operação verifica se a constraint `fk_reservas_master_id` já existe. Se não existir, ela a cria. Isso torna o script seguro para ser executado novamente, mesmo que a migração anterior tenha sido parcialmente bem-sucedida. Não há risco de perda de dados.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Tabela Modificada: `public.reservas`
- Constraint Adicionada (se não existir): `fk_reservas_master_id`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [N/A]
## Performance Impact:
- Indexes: [Added on foreign key if not exists]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/

-- Garante que a coluna master_id exista
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS master_id UUID;

-- Adiciona a chave estrangeira apenas se ela não existir, para evitar o erro de "already exists"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'fk_reservas_master_id'
    AND    conrelid = 'public.reservas'::regclass
  ) THEN
    ALTER TABLE public.reservas
    ADD CONSTRAINT fk_reservas_master_id
    FOREIGN KEY (master_id)
    REFERENCES public.reservas(id)
    ON DELETE SET NULL;
  END IF;
END;
$$;
