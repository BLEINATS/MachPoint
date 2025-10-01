/*
  # [Structural] Adiciona a flag is_default às Regras de Precificação
  ## Query Description:
  Este script adiciona uma nova coluna `is_default` (booleana) à tabela `pricing_rules`. Esta flag permitirá marcar uma regra como o "preço padrão" para um determinado esporte em uma quadra, que será usado quando nenhum preço promocional se aplicar. Para garantir a integridade, uma constraint de unicidade é adicionada para que só possa haver uma regra padrão por quadra e por esporte.
  **Impacto:** Nenhuma regra existente será perdida. A nova coluna `is_default` será adicionada com o valor padrão `false`.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `pricing_rules`:
    - Adiciona a coluna `is_default` (boolean, default false).
    - Adiciona uma constraint `unique_default_rule_per_sport_and_court`.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/

-- Passo 1: Adicionar a coluna is_default
ALTER TABLE public.pricing_rules
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Passo 2: Adicionar um comentário para clareza
COMMENT ON COLUMN public.pricing_rules.is_default IS 'Se verdadeiro, esta é a regra de preço padrão para o esporte nesta quadra.';

-- Passo 3: Criar um índice parcial para garantir que só haja uma regra padrão por quadra e esporte.
-- A constraint só se aplica às regras que são marcadas como `is_default = true`.
CREATE UNIQUE INDEX unique_default_rule_per_sport_and_court
ON public.pricing_rules (arena_id, quadra_id, sport_type)
WHERE (is_default = true);
