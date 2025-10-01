/*
  # [Structural] Adiciona a coluna court_type à tabela de quadras
  ## Query Description:
  Este script adiciona a coluna `court_type` que estava faltando na tabela `quadras`. A ausência desta coluna é a causa do erro "Could not find column" ao salvar. Peço desculpas pela falha em incluir esta coluna na migração anterior.
  **Impacto:** Nenhuma quadra existente será afetada. A coluna será adicionada com valor nulo para os registros existentes.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `quadras`: Adição da coluna `court_type` (text).
  ## Security Implications:
  - RLS Status: Sem alterações nas políticas existentes.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona a coluna para armazenar o tipo de piso da quadra
ALTER TABLE public.quadras
ADD COLUMN IF NOT EXISTS court_type text;
