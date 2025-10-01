/*
  # [Structural] Adiciona a funcionalidade de "Preço Padrão"
  ## Query Description:
  Este script aprimora a tabela `pricing_rules` para suportar um sistema de preços hierárquico. Ele adiciona uma coluna booleana `is_default` para marcar uma regra como o preço base para um esporte em uma quadra. Um índice único é criado para garantir que só possa existir UMA regra padrão por combinação de quadra e esporte.
  **Impacto:** Nenhuma regra existente será perdida. A nova coluna `is_default` será adicionada com o valor `false`. Será necessário editar suas regras para definir quais são os preços padrão.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `pricing_rules`: Adição da coluna `is_default` (boolean).
  - Índice: Criação de um índice único para garantir a integridade dos dados de preço padrão.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/

-- Adiciona a coluna para marcar uma regra como padrão
ALTER TABLE public.pricing_rules
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Adiciona um comentário para clareza
COMMENT ON COLUMN public.pricing_rules.is_default IS 'Se verdadeiro, esta regra é o preço padrão para o esporte, usada como fallback se nenhuma outra regra específica de horário se aplicar.';

-- Cria um índice único para garantir que só possa haver uma regra padrão por quadra e por tipo de esporte.
-- Isso previne inconsistências nos dados.
CREATE UNIQUE INDEX unique_default_rule_per_sport_quadra
ON public.pricing_rules (quadra_id, sport_type)
WHERE (is_default = true);
