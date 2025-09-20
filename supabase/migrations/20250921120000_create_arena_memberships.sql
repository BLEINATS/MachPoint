/*
# [Feature] Sistema de Seguir Arenas
[Este script cria a tabela `arena_memberships` para permitir que clientes sigam arenas, e ajusta as políticas de segurança para permitir a leitura pública de arenas.]

## Query Description: [Esta operação cria uma nova tabela para associar perfis de usuários a arenas. Também modifica a política da tabela `arenas` para que qualquer usuário autenticado possa listar todas as arenas disponíveis no sistema. Não há perda de dados.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tabela Adicionada: `public.arena_memberships`
- Política Modificada: `Allow authenticated users to read all arenas` em `public.arenas`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Usuários autenticados poderão seguir/deixar de seguir arenas e listar todas as arenas públicas.]

## Performance Impact:
- Indexes: [Added on foreign keys]
- Triggers: [None]
- Estimated Impact: [Baixo. A nova tabela é simples e indexada.]
*/

-- Passo 1: Criar a tabela para armazenar os "follows" das arenas
CREATE TABLE IF NOT EXISTS public.arena_memberships (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (profile_id, arena_id)
);

-- Passo 2: Habilitar RLS e criar índices
ALTER TABLE public.arena_memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_arena_memberships_profile_id ON public.arena_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_arena_memberships_arena_id ON public.arena_memberships(arena_id);

-- Passo 3: Criar políticas de segurança para a nova tabela
-- Permite que usuários leiam seus próprios "follows".
CREATE POLICY "Allow users to read their own memberships"
ON public.arena_memberships
FOR SELECT
USING (auth.uid() = profile_id);

-- Permite que usuários sigam uma arena (insiram um registro).
CREATE POLICY "Allow users to follow an arena"
ON public.arena_memberships
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Permite que usuários deixem de seguir uma arena (deletem um registro).
CREATE POLICY "Allow users to unfollow an arena"
ON public.arena_memberships
FOR DELETE
USING (auth.uid() = profile_id);

-- Passo 4: Garantir que a tabela de arenas seja legível por todos os usuários autenticados.
-- Removendo a política antiga, se existir, para evitar conflitos.
DROP POLICY IF EXISTS "Allow public read access to arenas" ON public.arenas;

-- Criando a nova política que permite a leitura para qualquer usuário autenticado.
CREATE POLICY "Allow authenticated users to read all arenas"
ON public.arenas
FOR SELECT
TO authenticated
USING (true);
