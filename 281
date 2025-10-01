-- Fix and Complete Notification System Setup
-- This script is idempotent and can be run safely even if parts of it have been applied before.

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    profile_id uuid, -- Can be null for admin-wide notifications
    message text NOT NULL,
    type text NOT NULL, -- e.g., 'new_reservation', 'cancellation', 'credit_update'
    read boolean DEFAULT false NOT NULL,
    link_to text, -- e.g., '/reservas?id=...'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notificacoes_pkey PRIMARY KEY (id),
    CONSTRAINT notificacoes_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT notificacoes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 2. Enable RLS and define policies (idempotently)
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notificacoes;
CREATE POLICY "Users can view their own notifications." ON public.notificacoes FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Arena owners can view all notifications for their arena." ON public.notificacoes;
CREATE POLICY "Arena owners can view all notifications for their arena." ON public.notificacoes FOR SELECT USING (
    (SELECT owner_id FROM public.arenas WHERE id = notificacoes.arena_id) = auth.uid()
);

DROP POLICY IF EXISTS "Users can mark their own notifications as read." ON public.notificacoes;
CREATE POLICY "Users can mark their own notifications as read." ON public.notificacoes FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- 3. Create or Replace Functions (already idempotent)

-- Function for new reservation notification
CREATE OR REPLACE FUNCTION public.handle_new_reservation_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  arena_owner_id uuid;
  client_name text;
  quadra_name text;
BEGIN
  -- Get arena owner
  SELECT owner_id INTO arena_owner_id FROM public.arenas WHERE id = NEW.arena_id;
  -- Get quadra name
  SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;
  -- Determine client name
  client_name := COALESCE(NEW.clientName, (SELECT name FROM public.profiles WHERE id = NEW.profile_id), 'Cliente');

  -- Notify arena owner if reservation is made by a client
  IF NEW.profile_id IS NOT NULL AND NEW.profile_id != arena_owner_id THEN
    INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
    VALUES (NEW.arena_id, arena_owner_id, 'Nova reserva de ' || client_name || ' na quadra ' || quadra_name || '.', 'new_reservation', '/reservas');
  END IF;

  -- Notify client if reservation is made by an admin
  IF NEW.profile_id IS NOT NULL AND auth.uid() = arena_owner_id THEN
    INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
    VALUES (NEW.arena_id, NEW.profile_id, 'Uma nova reserva foi feita para você na quadra ' || quadra_name || '.', 'new_reservation', '/perfil');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function for cancellation notification
CREATE OR REPLACE FUNCTION public.handle_cancellation_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  arena_owner_id uuid;
  client_name text;
  quadra_name text;
BEGIN
  IF OLD.status != 'cancelada' AND NEW.status = 'cancelada' THEN
    -- Get arena owner and quadra name
    SELECT owner_id INTO arena_owner_id FROM public.arenas WHERE id = NEW.arena_id;
    SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;
    client_name := COALESCE(NEW.clientName, (SELECT name FROM public.profiles WHERE id = NEW.profile_id), 'Cliente');

    -- Notify arena owner
    INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
    VALUES (NEW.arena_id, arena_owner_id, 'Reserva de ' || client_name || ' na quadra ' || quadra_name || ' foi cancelada.', 'cancellation', '/reservas');

    -- Notify client if they have a profile
    IF NEW.profile_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
      VALUES (NEW.arena_id, NEW.profile_id, 'Sua reserva na quadra ' || quadra_name || ' foi cancelada.', 'cancellation', '/perfil');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for credit change notification
CREATE OR REPLACE FUNCTION public.handle_credit_change_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify client about credit change
  IF NEW.aluno_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (arena_id, profile_id, message, type, link_to)
    VALUES (
      NEW.arena_id, 
      (SELECT profile_id FROM public.alunos WHERE id = NEW.aluno_id), 
      'Seu saldo de crédito foi atualizado: ' || NEW.description, 
      'credit_update', 
      '/perfil'
    );
  END IF;
  RETURN NEW;
END;
$$;


-- 4. Create or Replace Triggers (using DROP and CREATE for idempotency)

-- Trigger for new reservations
DROP TRIGGER IF EXISTS on_reservation_insert ON public.reservas;
CREATE TRIGGER on_reservation_insert
AFTER INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.handle_new_reservation_notification();

-- Trigger for reservation updates (cancellations)
DROP TRIGGER IF EXISTS on_reservation_update ON public.reservas;
CREATE TRIGGER on_reservation_update
AFTER UPDATE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.handle_cancellation_notification();

-- Trigger for credit transactions
DROP TRIGGER IF EXISTS on_credit_change ON public.credit_transactions;
CREATE TRIGGER on_credit_change
AFTER INSERT ON public.credit_transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_credit_change_notification();
