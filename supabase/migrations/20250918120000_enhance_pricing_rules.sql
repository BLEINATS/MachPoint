/*
  # [Structural] Aprimoramento da Tabela de Regras de Precificação
  ## Query Description: 
  Este script adiciona mais flexibilidade ao sistema de preços, permitindo valores distintos para clientes avulsos e mensais, além de um controle de ativação para cada regra.
  - A coluna `price` será RENOMEADA para `price_single` para representar o valor de hora avulsa.
  - Uma nova coluna `price_monthly` será ADICIONADA para o valor de hora de planos mensais.
  - Uma nova coluna `is_active` (booleana) será ADICIONADA para permitir ativar/desativar regras.
  **Impacto:** Os preços existentes serão mantidos como "preço avulso". Novas regras precisarão ter ambos os preços preenchidos. Nenhuma reserva existente será afetada.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Tabela `pricing_rules`: 
    - Renomeia `price` para `price_single`.
    - Adiciona a coluna `price_monthly` (numeric).
    - Adiciona a coluna `is_active` (boolean).
  ## Security Implications:
  - RLS Status: Sem alterações nas políticas existentes.
  - Policy Changes: Não.
  - Auth Requirements: Apenas o dono da arena pode modificar as regras.
*/

-- Renomeia a coluna de preço existente para preço avulso
ALTER TABLE public.pricing_rules RENAME COLUMN price TO price_single;

-- Adiciona a coluna para preço de mensalistas, com valor padrão 0
ALTER TABLE public.pricing_rules ADD COLUMN price_monthly numeric NOT NULL DEFAULT 0;

-- Adiciona a coluna para ativar/desativar a regra, com valor padrão true (ativa)
ALTER TABLE public.pricing_rules ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Adiciona comentários para clareza no schema
COMMENT ON COLUMN public.pricing_rules.price_single IS 'Preço por hora para reserva avulsa.';
COMMENT ON COLUMN public.pricing_rules.price_monthly IS 'Preço por hora para clientes com plano mensal.';
COMMENT ON COLUMN public.pricing_rules.is_active IS 'Indica se a regra de preço está ativa.';
