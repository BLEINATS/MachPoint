/*
  # [Structural] Adiciona a coluna operating_hours à tabela de quadras
  ## Query Description:
  Este script adiciona a coluna `operating_hours` (do tipo jsonb) à tabela `quadras`. Esta coluna é essencial para armazenar os horários de funcionamento da quadra (dias de semana e fim de semana). A ausência desta coluna é a causa do erro "Could not find the 'operating_hours' column" ao tentar salvar uma quadra.
  **Impacto:** Nenhuma quadra existente será afetada. A coluna será adicionada com um valor padrão.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `quadras`: Adição da coluna `operating_hours` (jsonb).
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona a coluna para armazenar os horários de funcionamento
ALTER TABLE public.quadras
ADD COLUMN IF NOT EXISTS operating_hours jsonb NOT NULL DEFAULT '{"weekday": {"start": "08:00", "end": "22:00"}, "weekend": {"start": "09:00", "end": "20:00"}}';

-- Adiciona um comentário para clareza
COMMENT ON COLUMN public.quadras.operating_hours IS 'Horários de funcionamento da quadra, separados por dias de semana e fim de semana.';
