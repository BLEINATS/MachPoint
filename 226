/*
  # [Structural] Adiciona a coluna sport_type à tabela de reservas
  ## Query Description:
  Este script adiciona uma nova coluna `sport_type` à tabela `reservas`. Esta coluna armazenará o esporte praticado em uma reserva específica, o que é crucial para o novo sistema de precificação flexível. A ausência desta coluna estava causando o erro "Could not find the ''sport_type'' column".
  **Impacto:** Nenhuma reserva existente será afetada. A coluna será adicionada com valor nulo para os registros existentes. Novas reservas poderão agora salvar o tipo de esporte.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `reservas`: Adição da coluna `sport_type` (text).
  ## Security Implications:
  - RLS Status: Sem alterações nas políticas existentes.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona a coluna para armazenar o tipo de esporte na reserva
ALTER TABLE public.reservas ADD COLUMN sport_type text;
-- Adiciona um comentário para clareza
COMMENT ON COLUMN public.reservas.sport_type IS 'Armazena o tipo de esporte praticado na reserva, usado para o cálculo de preço.';
