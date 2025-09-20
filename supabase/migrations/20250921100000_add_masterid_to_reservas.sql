/*
# [Fix] Adicionar master_id à tabela de reservas
[Este script adiciona a coluna `master_id` à tabela `reservas` para suportar corretamente a expansão de reservas recorrentes.]
## Query Description: [Esta operação adiciona uma nova coluna `master_id` à tabela `reservas` para vincular instâncias de reservas recorrentes à sua reserva mestre original. Não há perda de dados existente, pois apenas adiciona uma nova estrutura.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Coluna Adicionada: `master_id` em `public.reservas`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [N/A]
## Performance Impact:
- Indexes: [Added on foreign key]
- Triggers: [None]
- Estimated Impact: [Baixo. A nova coluna com índice não deve impactar o desempenho existente.]
*/

-- Adiciona a coluna master_id à tabela de reservas
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS master_id UUID;

-- Adiciona a chave estrangeira para a coluna master_id
ALTER TABLE public.reservas
ADD CONSTRAINT fk_reservas_master_id
FOREIGN KEY (master_id)
REFERENCES public.reservas(id)
ON DELETE SET NULL;

-- Cria um índice na nova coluna para otimizar as buscas
CREATE INDEX IF NOT EXISTS idx_reservas_master_id ON public.reservas(master_id);
