/*
          # Criação das Tabelas Centrais da Aplicação
          Este script cria as tabelas essenciais para o funcionamento do sistema, incluindo reservas, alunos, professores, turmas e eventos, e configura as políticas de segurança (RLS) para garantir o isolamento de dados por arena.

          ## Query Description: "Este script estabelece a fundação do banco de dados da sua aplicação. Ele não afeta dados existentes em outras tabelas (como 'quadras'), mas cria novas estruturas vazias. É um passo seguro e fundamental para a persistência de dados."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tabelas Criadas: turmas, professores, alunos, reservas, torneios, eventos_privados.
          - Políticas de Segurança (RLS): Habilitadas e configuradas para todas as novas tabelas, garantindo que apenas o dono da arena possa gerenciar seus próprios dados.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: As políticas são baseadas no `auth.uid()` do usuário logado.
          
          ## Performance Impact:
          - Indexes: Chaves primárias e estrangeiras são indexadas por padrão.
          - Triggers: Nenhum trigger é adicionado neste script.
          - Estimated Impact: Nenhum impacto em performance existente. A criação é rápida.
          */

-- Tabela de Professores
CREATE TABLE IF NOT EXISTS public.professores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    specialties TEXT[],
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own professores"
    ON public.professores FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL,
    sport TEXT,
    plan_name TEXT,
    monthly_fee NUMERIC,
    join_date DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own alunos"
    ON public.alunos FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL,
    quadra_id uuid REFERENCES public.quadras(id) ON DELETE SET NULL,
    sport TEXT,
    "daysOfWeek" INTEGER[],
    start_time TIME,
    end_time TIME,
    start_date DATE,
    end_date DATE,
    capacity INTEGER,
    student_ids uuid[],
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own turmas"
    ON public.turmas FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Tabela de Torneios (Eventos Públicos)
CREATE TABLE IF NOT EXISTS public.torneios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    banner_url TEXT,
    quadras_ids uuid[],
    start_time TIME,
    end_time TIME,
    categories TEXT[],
    max_participants INTEGER,
    registration_fee NUMERIC,
    participants JSONB,
    matches JSONB,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.torneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own torneios"
    ON public.torneios FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));
CREATE POLICY "Public can view torneios"
    ON public.torneios FOR SELECT
    USING (true);

-- Tabela de Eventos Privados
CREATE TABLE IF NOT EXISTS public.eventos_privados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "startTime" TIME,
    "endTime" TIME,
    "expectedGuests" INTEGER,
    quadras_ids uuid[],
    "additionalSpaces" TEXT[],
    services JSONB,
    "totalValue" NUMERIC,
    "depositValue" NUMERIC,
    "paymentConditions" TEXT,
    payments JSONB,
    notes TEXT,
    checklist JSONB,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.eventos_privados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own eventos privados"
    ON public.eventos_privados FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));

-- Tabela de Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quadra_id uuid REFERENCES public.quadras(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    "clientName" TEXT,
    "clientPhone" TEXT,
    notes TEXT,
    "isRecurring" BOOLEAN DEFAULT false,
    "recurringType" TEXT,
    "recurringEndDate" DATE,
    turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
    torneio_id uuid REFERENCES public.torneios(id) ON DELETE SET NULL,
    evento_id uuid REFERENCES public.eventos_privados(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena owners can manage their own reservas"
    ON public.reservas FOR ALL
    USING (auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = arena_id));
CREATE POLICY "Users can see their own reservas"
    ON public.reservas FOR SELECT
    USING (auth.uid() = profile_id);
CREATE POLICY "Public can view confirmed, non-private reservas"
    ON public.reservas FOR SELECT
    USING (status = 'confirmada' AND type != 'bloqueio');
