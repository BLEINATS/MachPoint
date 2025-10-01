/*
          # [Operação de Limpeza]
          Remoção de Funções de Cancelamento Obsoletas

          ## Query Description: "Este script remove com segurança funções antigas relacionadas ao cancelamento de reservas que não são mais utilizadas pelo sistema. A remoção dessas funções é necessária para evitar conflitos e erros durante futuras atualizações do banco de dados. Esta operação não afeta dados existentes e apenas limpa código obsoleto, garantindo a estabilidade do sistema."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Funções a serem removidas:
            - `log_cancellation_credit_in_history`
            - `cancel_booking`
            - `secure_client_cancel_function`
          
          ## Security Implications:
          - RLS Status: "No change"
          - Policy Changes: "No"
          - Auth Requirements: "Admin"
          
          ## Performance Impact:
          - Indexes: "No change"
          - Triggers: "No change"
          - Estimated Impact: "Nenhum impacto de performance. Apenas limpeza de código."
          */

DROP FUNCTION IF EXISTS public.log_cancellation_credit_in_history(uuid, uuid, numeric, uuid);
DROP FUNCTION IF EXISTS public.cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.secure_client_cancel_function(uuid);
