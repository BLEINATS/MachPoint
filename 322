-- =================================================================
-- ETAPA 1: Criar a tabela para o histórico de transações de pontos
-- =================================================================
CREATE TABLE IF NOT EXISTS public.gamification_point_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    type text NOT NULL,
    description text,
    related_reservation_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS e criar políticas de segurança
ALTER TABLE public.gamification_point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage point transactions for their arena" ON public.gamification_point_transactions;
CREATE POLICY "Admins can manage point transactions for their arena"
ON public.gamification_point_transactions FOR ALL
USING (public.is_arena_admin(arena_id));

DROP POLICY IF EXISTS "Users can view their own point transactions" ON public.gamification_point_transactions;
CREATE POLICY "Users can view their own point transactions"
ON public.gamification_point_transactions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.alunos
    WHERE alunos.id = gamification_point_transactions.aluno_id AND alunos.profile_id = auth.uid()
));

-- =================================================================
-- ETAPA 2: Criar uma função central para adicionar/remover pontos
-- =================================================================
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_arena_id uuid,
    p_amount integer,
    p_type text,
    p_description text,
    p_reservation_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualiza o saldo de pontos do aluno
    UPDATE public.alunos
    SET gamification_points = gamification_points + p_amount
    WHERE id = p_aluno_id;

    -- Insere o registro no histórico de transações
    INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, amount, type, description, related_reservation_id, created_by)
    VALUES (p_arena_id, p_aluno_id, p_amount, p_type, p_description, p_reservation_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_gamification_points(uuid, uuid, integer, text, text, uuid) TO authenticated;

-- =================================================================
-- ETAPA 3: Atualizar o gatilho de conclusão de reserva
-- =================================================================
-- Primeiro, removemos o gatilho e a função antigos para garantir uma atualização limpa
DROP TRIGGER IF EXISTS on_reservation_completed_add_points ON public.reservas;
DROP FUNCTION IF EXISTS public.handle_reservation_completion();

-- Recriamos a função para usar a nova função central `add_gamification_points`
CREATE OR REPLACE FUNCTION public.handle_reservation_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings public.gamification_settings;
    v_aluno public.alunos;
    v_points_to_add integer;
BEGIN
    -- Busca as configurações de gamificação da arena
    SELECT * INTO v_settings FROM public.gamification_settings WHERE arena_id = NEW.arena_id;

    -- Se a gamificação não estiver ativa, não faz nada
    IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
        RETURN NEW;
    END IF;

    -- Busca o perfil de aluno associado à reserva
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = NEW.profile_id AND arena_id = NEW.arena_id;
    
    -- Se não encontrar o aluno, não faz nada
    IF v_aluno IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calcula os pontos a serem adicionados
    v_points_to_add := v_settings.points_per_reservation + (COALESCE(NEW.total_price, 0) * v_settings.points_per_real);

    -- Se não houver pontos a adicionar, não faz nada
    IF v_points_to_add <= 0 THEN
        RETURN NEW;
    END IF;

    -- Chama a função central para adicionar pontos e registrar a transação
    PERFORM public.add_gamification_points(
        v_aluno.id,
        NEW.arena_id,
        v_points_to_add,
        'reservation_completed',
        'Pontos por reserva #' || substr(NEW.id::text, 1, 8),
        NEW.id
    );

    RETURN NEW;
END;
$$;

-- Recriamos o gatilho para usar a nova função
CREATE TRIGGER on_reservation_completed_add_points
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (NEW.status = 'realizada' AND OLD.status <> 'realizada')
EXECUTE FUNCTION public.handle_reservation_completion();
