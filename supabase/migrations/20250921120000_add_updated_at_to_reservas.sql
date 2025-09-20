/*
# [Feature] Adicionar Timestamp de Atualização para Reservas
[Este script adiciona uma coluna `updated_at` à tabela `reservas` e cria um gatilho para atualizá-la automaticamente sempre que uma reserva for modificada. Isso é crucial para rastrear atividades recentes, como cancelamentos.]

## Query Description: [Esta operação é segura e não destrutiva. Ela adiciona uma nova coluna `updated_at` com um valor padrão e, em seguida, cria uma função e um gatilho (trigger) no banco de dados. Nenhum dado existente será perdido.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Coluna Adicionada: `updated_at` em `public.reservas`
- Função Adicionada: `public.handle_updated_at`
- Gatilho Adicionado: `on_reservas_update` na tabela `public.reservas`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [None]
- Triggers: [Added]
- Estimated Impact: [Mínimo. O gatilho é leve e executa apenas em operações de UPDATE na tabela de reservas.]
*/

-- Adiciona a coluna `updated_at` à tabela de reservas, com o valor padrão sendo o momento da criação.
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Cria uma função que será executada pelo gatilho para atualizar o campo `updated_at`.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Define o valor da coluna `updated_at` do novo registro como o tempo atual.
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove qualquer gatilho com o mesmo nome que possa existir, para evitar conflitos.
DROP TRIGGER IF EXISTS on_reservas_update ON public.reservas;

-- Cria o gatilho que executa a função `handle_updated_at` antes de cada operação de UPDATE na tabela `reservas`.
CREATE TRIGGER on_reservas_update
BEFORE UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
