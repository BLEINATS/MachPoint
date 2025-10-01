/*
# [Fix] Corrigir a Função de Adicionar Crédito
[Este script corrige a implementação da função `add_credit_to_profile` para usar o método correto de verificação de permissão dentro de um contexto SECURITY DEFINER.]
## Query Description: [A versão anterior da função usava `auth.uid()`, que não funciona como esperado em funções `SECURITY DEFINER`. Esta nova versão usa `(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid` para obter o ID do usuário que está chamando a função, garantindo que a verificação de dono da arena funcione corretamente. Isso permite que o saldo de crédito seja atualizado de forma segura, resolvendo o bug em que os créditos não eram salvos.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Function Modified: `public.add_credit_to_profile`
## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [A função continua segura, verificando se o chamador é o dono da arena antes de permitir a atualização do saldo de crédito.]
## Performance Impact:
- Indexes: [N/A]
- Triggers: [None]
- Estimated Impact: [Baixo. A lógica da função foi corrigida, sem impacto de desempenho.]
*/
CREATE OR REPLACE FUNCTION public.add_credit_to_profile(
    profile_id_to_update UUID,
    arena_id_to_check UUID,
    amount_to_add NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_id UUID;
BEGIN
  -- Obtém o UID do usuário que está chamando a função a partir do JWT.
  -- Este é o método correto para obter o ID do chamador dentro de uma função SECURITY DEFINER.
  caller_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;

  -- Verifica se o chamador é o dono da arena.
  IF EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = arena_id_to_check AND owner_id = caller_id
  ) THEN
    -- Se a verificação for bem-sucedida, atualiza o saldo de crédito.
    UPDATE public.profiles
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = profile_id_to_update;
  ELSE
    -- Se o usuário não for o dono, lança um erro.
    RAISE EXCEPTION 'Permissão negada. Você não é o dono desta arena.';
  END IF;
END;
$$;
