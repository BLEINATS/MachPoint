-- Fix and Complete Notification System Setup
-- This script is idempotent and can be run safely even if parts of it have been applied before.
-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arena_id uuid NOT NULL,
    profile_id uuid,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link_to text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notificacoes_pkey PRIMARY KEY (id),
    CONSTRAINT notificacoes_arena_id_fkey FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE CASCADE,
    CONSTRAINT notificacoes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notificacoes;
CREATE POLICY "Users can view their own notifications." ON public.notificacoes FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Arena admins can view their arena's notifications." ON public.notificacoes;
CREATE POLICY "Arena admins can view their arena's notifications." ON public.notificacoes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM arenas
  WHERE (arenas.id = notificacoes.arena_id) AND (arenas.owner_id = auth.uid()))));
DROP POLICY IF EXISTS "Users can update their own notifications to read." ON public.notificacoes;
CREATE POLICY "Users can update their own notifications to read." ON public.notificacoes FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- 2. Function to create notifications for new reservations
CREATE OR REPLACE FUNCTION public.notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  arena_owner_id uuid;
  arena_name text;
  quadra_name text;
BEGIN
  -- Get arena owner and name
  SELECT owner_id, name INTO arena_owner_id, arena_name FROM public.arenas WHERE id = NEW.arena_id;
  SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;

  -- Notify arena owner if a client made the reservation
  IF NEW.profile_id IS NOT NULL AND NEW.created_by_name != arena_name THEN
    INSERT INTO public.notificacoes(arena_id, profile_id, message, type, link_to)
    VALUES(NEW.arena_id, arena_owner_id, 'Nova reserva de ' || NEW.clientName || ' na quadra ' || quadra_name || '.', 'new_reservation', '/reservas');
  END IF;

  -- Notify client if an admin made the reservation
  IF NEW.profile_id IS NOT NULL AND NEW.created_by_name = arena_name THEN
    INSERT INTO public.notificacoes(arena_id, profile_id, message, type, link_to)
    VALUES(NEW.arena_id, NEW.profile_id, 'Sua reserva na quadra ' || quadra_name || ' foi confirmada pela arena.', 'new_reservation', '/perfil');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to create notifications for cancelled reservations
CREATE OR REPLACE FUNCTION public.notify_reservation_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  arena_owner_id uuid;
  arena_name text;
  quadra_name text;
BEGIN
  IF OLD.status <> 'cancelada' AND NEW.status = 'cancelada' THEN
    SELECT owner_id, name INTO arena_owner_id, arena_name FROM public.arenas WHERE id = NEW.arena_id;
    SELECT name INTO quadra_name FROM public.quadras WHERE id = NEW.quadra_id;

    -- Notify arena owner
    INSERT INTO public.notificacoes(arena_id, profile_id, message, type, link_to)
    VALUES(NEW.arena_id, arena_owner_id, 'A reserva de ' || NEW.clientName || ' na quadra ' || quadra_name || ' foi cancelada.', 'cancellation', '/reservas');

    -- Notify client
    IF NEW.profile_id IS NOT NULL THEN
      INSERT INTO public.notificacoes(arena_id, profile_id, message, type, link_to)
      VALUES(NEW.arena_id, NEW.profile_id, 'Sua reserva na quadra ' || quadra_name || ' foi cancelada.', 'cancellation', '/perfil');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to notify about credit changes
CREATE OR REPLACE FUNCTION public.notify_credit_change()
RETURNS TRIGGER AS $$
DECLARE
  aluno_profile_id uuid;
BEGIN
  SELECT profile_id INTO aluno_profile_id FROM public.alunos WHERE id = NEW.aluno_id;
  
  IF aluno_profile_id IS NOT NULL THEN
    INSERT INTO public.notificacoes(arena_id, profile_id, message, type, link_to)
    VALUES(NEW.arena_id, aluno_profile_id, 'Seu saldo de crédito foi atualizado: ' || NEW.description, 'credit_update', '/perfil');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Drop existing triggers to avoid errors
DROP TRIGGER IF EXISTS on_reservation_insert ON public.reservas;
DROP TRIGGER IF EXISTS on_reservation_update ON public.reservas;
DROP TRIGGER IF EXISTS on_credit_transaction_insert ON public.credit_transactions;

-- 6. Create triggers
CREATE TRIGGER on_reservation_insert
  AFTER INSERT ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_reservation();

CREATE TRIGGER on_reservation_update
  AFTER UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_cancellation();

CREATE TRIGGER on_credit_transaction_insert
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_credit_change();
