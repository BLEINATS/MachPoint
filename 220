/*
          # Criação da Tabela de Quadras e Políticas de Segurança
          Este script cria a tabela `quadras` para armazenar informações detalhadas sobre cada quadra da arena. Também implementa políticas de segurança (RLS) para garantir que apenas os proprietários das arenas possam gerenciar suas respectivas quadras.

          ## Query Description: [Este script é seguro e estrutural. Ele adiciona a tabela `quadras` e políticas de RLS. Não há risco de perda de dados existentes, pois a tabela é nova. A segurança de dados por arena (multi-tenancy) é o foco principal destas políticas.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tabela criada: `public.quadras`
          - Colunas: id, arena_id, name, sport_type, status, capacity, price_per_hour, location, description, floor_type, is_covered, has_lighting, comodidades (jsonb), rules, horarios (jsonb), booking_interval_minutes, photos (text[]), created_at.
          - Relacionamentos: Chave estrangeira de `quadras.arena_id` para `arenas.id`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Policies Adicionadas:
            - `Allow authenticated read access`: Permite que qualquer usuário logado veja as quadras (para páginas públicas).
            - `Allow owners to insert courts`: Permite que donos de arena criem quadras apenas para suas arenas.
            - `Allow owners to update their own courts`: Permite que donos de arena atualizem apenas suas próprias quadras.
            - `Allow owners to delete their own courts`: Permite que donos de arena excluam apenas suas próprias quadras.
          - Auth Requirements: Autenticação via Supabase Auth é necessária para todas as operações de escrita.
          
          ## Performance Impact:
          - Indexes: Chave primária em `id` e chave estrangeira em `arena_id` são indexadas automaticamente.
          - Triggers: Nenhum.
          - Estimated Impact: Baixo. A performance de leitura pode ser otimizada adicionando índices em colunas frequentemente filtradas no futuro, se necessário.
          */

-- Cria a tabela 'quadras'
CREATE TABLE public.quadras (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL,
    name text NOT NULL,
    sport_type text,
    status text NOT NULL DEFAULT 'ativa'::text,
    capacity integer NOT NULL DEFAULT 4,
    price_per_hour numeric NOT NULL DEFAULT 0,
    location text,
    description text,
    floor_type text,
    is_covered boolean NOT NULL DEFAULT false,
    has_lighting boolean NOT NULL DEFAULT false,
    comodidades jsonb NOT NULL DEFAULT '{}'::jsonb,
    rules text,
    horarios jsonb NOT NULL DEFAULT '{}'::jsonb,
    booking_interval_minutes integer NOT NULL DEFAULT 60,
    photos text[] NOT NULL DEFAULT ARRAY[]::text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT quadras_pkey PRIMARY KEY (id),
    CONSTRAINT quadras_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES public.arenas(id) ON DELETE CASCADE
);

-- Adiciona comentários para clareza
COMMENT ON TABLE public.quadras IS 'Armazena as informações das quadras de cada arena.';
COMMENT ON COLUMN public.quadras.booking_interval_minutes IS 'Duração padrão da reserva em minutos';
COMMENT ON COLUMN public.quadras.photos IS 'Array de URLs das fotos da quadra';
COMMENT ON COLUMN public.quadras.comodidades IS 'Objeto JSON com as comodidades disponíveis (ex: vestiario, chuveiro)';
COMMENT ON COLUMN public.quadras.horarios IS 'Objeto JSON com os horários de funcionamento';

-- Habilita Row Level Security
ALTER TABLE public.quadras ENABLE ROW LEVEL SECURITY;

-- Permite que usuários autenticados leiam todas as quadras (para páginas públicas)
CREATE POLICY "Allow authenticated read access" ON public.quadras
FOR SELECT
TO authenticated
USING (true);

-- Permite que donos de arenas insiram quadras apenas em suas próprias arenas
CREATE POLICY "Allow owners to insert courts" ON public.quadras
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Permite que donos de arenas atualizem apenas suas próprias quadras
CREATE POLICY "Allow owners to update their own courts" ON public.quadras
FOR UPDATE
TO authenticated
USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id))
WITH CHECK (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Permite que donos de arenas deletem apenas suas próprias quadras
CREATE POLICY "Allow owners to delete their own courts" ON public.quadras
FOR DELETE
TO authenticated
USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));
