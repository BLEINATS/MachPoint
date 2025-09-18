/*
  # [Structural] Adiciona a flag de Preço Padrão
  ## Query Description:
  Este script aprimora a tabela `pricing_rules` para suportar uma hierarquia de preços. Ele adiciona uma coluna booleana `is_default` que permite marcar uma regra como o "preço padrão" para um esporte em uma quadra. Isso possibilita ter um preço base que pode ser sobreposto por regras promocionais em horários específicos. Um índice único é adicionado para garantir que apenas uma regra padrão possa existir por esporte em cada quadra.
  **Impacto:** Nenhuma regra existente será perdida. A nova coluna `is_default` será adicionada com o valor `false` para todas as regras existentes.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `pricing_rules`: Adição da coluna `is_default` (boolean, default false).
  - Adição de um índice único para garantir a integridade dos dados.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Passo 1: Adicionar a coluna 'is_default' à tabela de regras de precificação.
ALTER TABLE public.pricing_rules
ADD COLUMN is_default boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.pricing_rules.is_default IS 'Marca esta regra como o preço padrão para o esporte na quadra. Apenas uma regra padrão por esporte por quadra é permitida.';
-- Passo 2: Criar um índice único para garantir que apenas uma regra possa ser a padrão
-- para uma combinação específica de quadra e esporte.
CREATE UNIQUE INDEX one_default_rule_per_sport_per_quadra ON public.pricing_rules (quadra_id, sport_type)
WHERE (is_default = true);
