/*
  # [Structural] Criação da Tabela de Descontos por Duração
  ## Query Description: 
  Este script cria uma nova tabela `duration_discounts` para permitir a configuração de descontos percentuais baseados na duração da reserva (em horas). Isso adiciona uma nova camada de promoções flexíveis ao sistema.
  **Impacto:** Nenhuma reserva ou preço existente será afetado. Esta é uma adição não destrutiva. Após a migração, uma nova seção de configuração será adicionada na interface para gerenciar esses descontos.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `duration_discounts`: Criação da tabela com colunas para `arena_id`, `duration_hours`, `discount_percentage`, e `is_active`.
  ## Security Implications:
  - RLS Status: Habilitado na nova tabela.
  - Policy Changes: Novas políticas serão criadas para `duration_discounts`, permitindo que apenas o dono da arena gerencie suas próprias regras.
*/
-- 1. Cria a nova tabela para descontos por duração
CREATE TABLE public.duration_discounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL,
    duration_hours integer NOT NULL,
    discount_percentage numeric NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT duration_discounts_pkey PRIMARY KEY (id),
    CONSTRAINT duration_discounts_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT duration_discounts_unique_duration UNIQUE (arena_id, duration_hours)
);
COMMENT ON COLUMN public.duration_discounts.duration_hours IS 'Duração da reserva em horas para o desconto ser aplicado';
COMMENT ON COLUMN public.duration_discounts.discount_percentage IS 'Percentual de desconto (ex: 10 para 10%)';
-- 2. Habilita Row Level Security na nova tabela
ALTER TABLE public.duration_discounts ENABLE ROW LEVEL SECURITY;
-- 3. Cria as políticas de segurança
CREATE POLICY "Public can view duration discounts" ON public.duration_discounts
FOR SELECT USING (true);
CREATE POLICY "Arena owners can manage their own duration discounts" ON public.duration_discounts
FOR ALL USING (
    auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = duration_discounts.arena_id)
);
