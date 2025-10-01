-- Passo 1 de 2: Adiciona o novo status 'realizada' ao tipo de enumeração.
-- Esta operação precisa ser executada em uma transação separada antes de ser utilizada.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'realizada' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reservation_status')) THEN
        ALTER TYPE public.reservation_status ADD VALUE 'realizada';
    END IF;
END
$$;
