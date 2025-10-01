/*
  # [Data] Separa Horários de Fim de Semana
  ## Query Description:
  Este script atualiza os dados na coluna `horarios` (do tipo jsonb) da tabela `quadras`. Ele substitui a chave única "weekend" por duas chaves separadas: "saturday" e "sunday". O valor do antigo campo "weekend" será copiado para ambos os novos campos, garantindo que nenhum dado de horário seja perdido. Isso permite a configuração de horários de funcionamento distintos para sábado e domingo.
  **Impacto:** Todos os registros de quadras existentes serão atualizados. Esta é uma migração de dados segura.
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Tabela `quadras`, Coluna `horarios`: A estrutura do JSONB será modificada de `{"weekday": ..., "weekend": ...}` para `{"weekday": ..., "saturday": ..., "sunday": ...}`.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
UPDATE public.quadras
SET 
  horarios = 
    jsonb_build_object(
      'weekday', horarios->'weekday',
      'saturday', horarios->'weekend',
      'sunday', horarios->'weekend'
    )
WHERE 
  horarios ? 'weekend';
