/*
  # [Dangerous] Exclusão de Todos os Dados de Quadras
  ## Query Description: 
  Este script irá apagar PERMANENTEMENTE todas as quadras cadastradas para a sua arena. Todas as regras de precificação associadas a essas quadras também serão excluídas.
  **Atenção:** Esta ação é irreversível. Faça um backup dos seus dados se eles forem importantes.
  ## Metadata:
  - Schema-Category: "Dangerous"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false
  ## Structure Details:
  - Tabela `quadras`: Todos os registros da sua arena serão excluídos.
  - Tabela `pricing_rules`: Todos os registros associados às suas quadras serão excluídos em cascata.
  ## Security Implications:
  - RLS Status: As políticas de segurança garantem que apenas os dados da sua própria arena sejam afetados.
  - Policy Changes: Não.
  - Auth Requirements: Apenas o dono da arena pode executar esta ação.
*/
-- Exclui todas as quadras da arena do usuário logado.
-- A exclusão das regras de preço acontecerá em cascata devido à chave estrangeira.
DELETE FROM public.quadras
WHERE arena_id = (
  SELECT id FROM public.arenas WHERE owner_id = auth.uid()
);
