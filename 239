/*
# [FIX] Adiciona a coluna `payment_status` à tabela de reservas
[Este script adiciona a coluna `payment_status` à tabela `reservas` para permitir o rastreamento do status de pagamento de cada reserva.]
## Query Description: [Esta operação adiciona uma nova coluna `payment_status` à tabela `reservas` com um valor padrão de 'pendente'. Não há perda de dados existente, pois apenas adiciona uma nova estrutura.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Tabela Modificada: `public.reservas`
- Coluna Adicionada: `payment_status`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [N/A]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Baixo. Adicionar uma coluna com valor padrão pode levar algum tempo em tabelas muito grandes, mas geralmente é rápido.]
*/

-- Adiciona a coluna se ela não existir
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Atualiza valores nulos para o padrão 'pendente'
UPDATE public.reservas
SET payment_status = 'pendente'
WHERE payment_status IS NULL;

-- Garante que a coluna não seja nula
ALTER TABLE public.reservas
ALTER COLUMN payment_status SET NOT NULL;

-- Garante que o valor padrão seja 'pendente'
ALTER TABLE public.reservas
ALTER COLUMN payment_status SET DEFAULT 'pendente';

-- Remove a restrição antiga se existir para evitar conflitos
ALTER TABLE public.reservas
DROP CONSTRAINT IF EXISTS check_payment_status;

-- Adiciona a restrição de verificação para os valores permitidos
ALTER TABLE public.reservas
ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pago', 'pendente', 'parcialmente_pago'));
