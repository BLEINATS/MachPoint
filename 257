/*
  # [Structural] Correção Completa da Tabela Quadras
  ## Query Description:
  Este script adiciona TODAS as colunas que estão faltando na tabela `quadras` para garantir a compatibilidade com o formulário da aplicação. Isso resolverá os erros "Could not find column" ao salvar uma quadra. Serão adicionadas colunas para descrição, regras, comodidades, duração da reserva, capacidade, esportes, status e foto de capa.
  **Impacto:** Nenhuma quadra existente será afetada. As novas colunas serão adicionadas com valores padrão seguros.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Tabela `quadras`: Adição das colunas `description`, `rules`, `amenities`, `booking_duration_minutes`, `capacity`, `sports`, `status`, `cover_photo`.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona as colunas faltantes para evitar erros futuros
ALTER TABLE public.quadras
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS rules text,
ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS booking_duration_minutes integer NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS capacity integer,
ADD COLUMN IF NOT EXISTS sports text[],
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativa',
ADD COLUMN IF NOT EXISTS cover_photo text;
