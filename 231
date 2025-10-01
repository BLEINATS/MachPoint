/*
  # [Structural] Adiciona a coluna amenities à tabela de quadras
  ## Query Description:
  Este script adiciona uma nova coluna `amenities` (do tipo text[]) à tabela `quadras`. Esta coluna é necessária para armazenar a lista de comodidades de cada quadra (ex: Wi-Fi, Vestiário). A ausência desta coluna estava causando o erro "Could not find the ''amenities'' column" ao tentar salvar uma nova quadra.
  **Impacto:** Nenhuma quadra existente será afetada. A coluna será adicionada com um valor padrão de lista vazia ('{}').
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `quadras`: Adição da coluna `amenities` (text[]).
  ## Security Implications:
  - RLS Status: Sem alterações nas políticas existentes.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Adiciona a coluna para armazenar as comodidades da quadra
ALTER TABLE public.quadras
ADD COLUMN amenities text[] NOT NULL DEFAULT '{}';

-- Adiciona um comentário para clareza
COMMENT ON COLUMN public.quadras.amenities IS 'Lista de comodidades da quadra, como "Wi-Fi", "Vestiário", etc.';
