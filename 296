/*
          # [FIX] Recriação Segura do Gatilho de Notificação de Reserva

          [Este script corrige um erro de dependência ao atualizar a função de notificação de novas reservas. Ele remove o gatilho antigo, atualiza a função e recria o gatilho com a definição correta.]

          ## Query Description: ["Esta operação é segura e não afeta dados existentes. Ela apenas reestrutura componentes internos do banco de dados para permitir atualizações futuras e garantir que as notificações de novas reservas funcionem corretamente."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Afeta o gatilho `on_new_reservation_notify` na tabela `reservas`.
          - Afeta a função `handle_new_notification`.
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [N/A]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [Modified]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */
-- Etapa 1: Remover o gatilho dependente
DROP TRIGGER IF EXISTS on_new_reservation_notify ON public.reservas;

-- Etapa 2: Remover a função antiga (se existir)
DROP FUNCTION IF EXISTS public.handle_new_notification();

-- Etapa 3: Recriar a função com a lógica correta
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificação para o administrador da arena
  INSERT INTO public.notificacoes (arena_id, message, type, link_to)
  VALUES (NEW.arena_id, 'Nova reserva de ' || NEW.clientName || ' para a quadra ' || (SELECT name FROM public.quadras WHERE id = NEW.quadra_id) || '.', 'nova_reserva', '/reservas?id=' || NEW.id);

  -- Notificação para o cliente (se tiver um perfil associado)
  IF NEW.profile_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (profile_id, arena_id, message, type, link_to)
    VALUES (NEW.profile_id, NEW.arena_id, 'Sua reserva na quadra ' || (SELECT name FROM public.quadras WHERE id = NEW.quadra_id) || ' foi confirmada!', 'nova_reserva', '/perfil');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Etapa 4: Recriar o gatilho para usar a nova função
CREATE TRIGGER on_new_reservation_notify
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification();
