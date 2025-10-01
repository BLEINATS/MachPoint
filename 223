/*
  # [Structural] Adiciona a coluna total_price à tabela de reservas
  ## Query Description:
  Este script adiciona uma nova coluna `total_price` à tabela `reservas`. Esta coluna é essencial para armazenar o valor calculado de cada reserva, baseado no novo sistema de precificação flexível. A ausência desta coluna estava causando o erro "Could not find the ''total_price'' column" ao tentar salvar uma nova reserva.
  **Impacto:** Nenhuma reserva existente será afetada. A coluna será adicionada com um valor padrão de 0 para os registros existentes. Novas reservas passarão a salvar o valor total calculado.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `reservas`: Adição da coluna `total_price` (numeric, default 0).
  ## Security Implications:
  - RLS Status: Sem alterações nas políticas existentes.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona a coluna para armazenar o valor total da reserva
ALTER TABLE public.reservas ADD COLUMN total_price numeric DEFAULT 0;
-- Adiciona um comentário para clareza
COMMENT ON COLUMN public.reservas.total_price IS 'Armazena o valor total calculado para a reserva.';
