/*
  # [Structural] Criação da Tabela de Regras de Precificação
  ## Query Description: 
  Este script reestrutura a forma como os preços das quadras são armazenados, passando de um preço fixo por hora para um sistema de regras flexível.
  - A coluna `price_per_hour` será REMOVIDA da tabela `quadras`.
  - Uma nova tabela `pricing_rules` será CRIADA para armazenar preços baseados em esporte, horário e dia da semana.
  - O cálculo de preço nas reservas passará a depender das regras cadastradas nesta nova tabela.
  **Impacto:** Nenhuma reserva existente será afetada, mas o preço para novas reservas dependerá das regras que você criar. É importante cadastrar as novas regras de preço após aplicar esta migração.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Tabela `quadras`: Remoção da coluna `price_per_hour`.
  - Tabela `pricing_rules`: Criação da tabela com colunas para `quadra_id`, `sport_type`, `start_time`, `end_time`, `days_of_week`, e `price`.
  ## Security Implications:
  - RLS Status: Habilitado na nova tabela `pricing_rules`.
  - Policy Changes: Novas políticas serão criadas para `pricing_rules`, permitindo que apenas o dono da arena gerencie suas próprias regras.
  - Auth Requirements: Apenas usuários autenticados como donos de arena podem modificar as regras.
*/
-- 1. Cria a nova tabela para regras de precificação
CREATE TABLE public.pricing_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL,
    quadra_id uuid NOT NULL,
    sport_type text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    days_of_week integer[] NOT NULL, -- 0=Dom, 1=Seg, ..., 6=Sáb
    price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT pricing_rules_pkey PRIMARY KEY (id),
    CONSTRAINT pricing_rules_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT pricing_rules_quadra_id_fkey FOREIGN KEY (quadra_id) REFERENCES quadras(id) ON DELETE CASCADE
);
COMMENT ON COLUMN public.pricing_rules.days_of_week IS 'Array de dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)';
-- 2. Remove a coluna de preço fixo da tabela de quadras
ALTER TABLE public.quadras DROP COLUMN IF EXISTS price_per_hour;
-- 3. Habilita Row Level Security na nova tabela
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
-- 4. Cria as políticas de segurança para a tabela de regras de precificação
CREATE POLICY "Public can view pricing rules" ON public.pricing_rules
FOR SELECT USING (true);
CREATE POLICY "Arena owners can manage their own pricing rules" ON public.pricing_rules
FOR ALL USING (
    auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = pricing_rules.arena_id)
);
