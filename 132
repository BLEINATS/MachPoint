-- 1. Create the notifications table
CREATE TABLE public.notificacoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    arena_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    link_to text,
    type text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notificacoes_pkey PRIMARY KEY (id),
    CONSTRAINT notificacoes_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES public.arenas(id) ON DELETE CASCADE,
    CONSTRAINT notificacoes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
-- 2. Enable RLS and create policies
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notificacoes
    FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can update their own notifications" ON public.notificacoes
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
-- 3. Create function to handle new reservation notifications
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
    v_quadra_name text;
    v_creator_profile_id uuid := auth.uid();
    v_notification_message text;
BEGIN
    -- Get arena owner and quadra name
    SELECT owner_id INTO v_owner_id FROM public.arenas WHERE id = NEW.arena_id;
    SELECT name INTO v_quadra_name FROM public.quadras WHERE id = NEW.quadra_id;
    -- If client made the reservation, notify the admin
    IF v_creator_profile_id = NEW.profile_id THEN
        v_notification_message := 'Nova reserva de ' || NEW.clientName || ' na quadra ' || v_quadra_name || '.';
        INSERT INTO public.notificacoes (arena_id, profile_id, message, link_to, type)
        VALUES (NEW.arena_id, v_owner_id, v_notification_message, '/reservas', 'new_reservation');
    -- If admin made the reservation for a client, notify the client
    ELSIF NEW.profile_id IS NOT NULL THEN
        v_notification_message := 'Sua reserva na quadra ' || v_quadra_name || ' foi confirmada pela arena!';
        INSERT INTO public.notificacoes (arena_id, profile_id, message, link_to, type)
        VALUES (NEW.arena_id, NEW.profile_id, v_notification_message, '/perfil', 'new_reservation');
    END IF;
    RETURN NEW;
END;
$$;
-- 4. Create trigger for new reservations
CREATE TRIGGER on_reservation_created
    AFTER INSERT ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_reservation_notification();
-- 5. Create function to handle cancellation notifications
CREATE OR REPLACE FUNCTION public.handle_cancellation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
    v_quadra_name text;
    v_notification_message_for_admin text;
    v_notification_message_for_client text;
BEGIN
    IF NEW.status = 'cancelada' AND OLD.status <> 'cancelada' THEN
        -- Get arena owner and quadra name
        SELECT owner_id INTO v_owner_id FROM public.arenas WHERE id = NEW.arena_id;
        SELECT name INTO v_quadra_name FROM public.quadras WHERE id = NEW.quadra_id;
        -- Notify Admin
        v_notification_message_for_admin := 'A reserva de ' || NEW.clientName || ' na quadra ' || v_quadra_name || ' foi cancelada.';
        INSERT INTO public.notificacoes (arena_id, profile_id, message, link_to, type)
        VALUES (NEW.arena_id, v_owner_id, v_notification_message_for_admin, '/reservas', 'cancellation');
        -- Notify Client if they have a profile
        IF NEW.profile_id IS NOT NULL THEN
            v_notification_message_for_client := 'Sua reserva na quadra ' || v_quadra_name || ' em ' || to_char(NEW.date, 'DD/MM') || ' foi cancelada.';
            INSERT INTO public.notificacoes (arena_id, profile_id, message, link_to, type)
            VALUES (NEW.arena_id, NEW.profile_id, v_notification_message_for_client, '/perfil', 'cancellation');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
-- 6. Create trigger for reservation cancellations
CREATE TRIGGER on_reservation_cancelled
    AFTER UPDATE OF status ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.handle_cancellation_notification();
-- 7. Create function to handle credit notifications
CREATE OR REPLACE FUNCTION public.handle_credit_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_message text;
BEGIN
    SELECT profile_id INTO v_profile_id FROM public.alunos WHERE id = NEW.aluno_id;
    IF v_profile_id IS NOT NULL THEN
        IF NEW.amount > 0 THEN
            v_message := 'Você recebeu ' || to_char(NEW.amount, 'L9G999D99') || ' em créditos. Motivo: ' || NEW.description;
        ELSE
            v_message := 'Foi utilizado ' || to_char(NEW.amount * -1, 'L9G999D99') || ' do seu saldo. Motivo: ' || NEW.description;
        END IF;
        INSERT INTO public.notificacoes (arena_id, profile_id, message, link_to, type)
        VALUES (NEW.arena_id, v_profile_id, v_message, '/perfil', 'credit_update');
    END IF;
    RETURN NEW;
END;
$$;
-- 8. Create trigger for credit transactions
CREATE TRIGGER on_credit_transaction_created
    AFTER INSERT ON public.credit_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_credit_notification();
