/*
# [Feature] Sistema de Aluguel de Itens
[Este script prepara o banco de dados para suportar o aluguel de itens (raquetes, bolas, etc.) junto com as reservas.]
## Query Description: [Esta operação adiciona uma nova tabela `rental_items` para o catálogo de itens e uma coluna `rented_items` (JSONB) na tabela `reservas` para registrar os itens alugados. Não há perda de dados, apenas adição de novas estruturas.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Tabela Adicionada: `public.rental_items`
- Coluna Adicionada: `rented_items` em `public.reservas`
## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [As políticas de RLS garantirão que apenas o dono da arena possa gerenciar os itens de aluguel.]
## Performance Impact:
- Indexes: [Added on foreign keys]
- Triggers: [None]
- Estimated Impact: [Baixo. Novas tabelas e colunas com índices não devem impactar o desempenho existente.]
*/
-- Passo 1: Criar a tabela para os itens de aluguel
CREATE TABLE IF NOT EXISTS public.rental_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Passo 2: Habilitar RLS e criar índices
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rental_items_arena_id ON public.rental_items(arena_id);
-- Passo 3: Adicionar a coluna para armazenar itens alugados na reserva
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS rented_items JSONB;
-- Passo 4: Definir políticas de segurança para a nova tabela
-- Permite que donos de arena gerenciem (leiam, insiram, atualizem, excluam) seus próprios itens.
CREATE POLICY "Allow arena owners to manage their rental items"
ON public.rental_items
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE public.arenas.id = public.rental_items.arena_id AND public.arenas.owner_id = auth.uid()
  )
);
-- Permite que qualquer pessoa leia os itens de uma arena (para exibir no modal de reserva).
CREATE POLICY "Allow anyone to read rental items"
ON public.rental_items
FOR SELECT
USING (true);
