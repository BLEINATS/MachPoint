/*
  # [Structural] Torna o E-mail de Alunos Opcional
  ## Query Description:
  Este script modifica a tabela `alunos` para tornar o campo `email` opcional. Atualmente, ele é obrigatório, o que força o sistema a criar um e-mail temporário ("placeholder-...") ao cadastrar um cliente durante uma reserva. Esta alteração permitirá que o campo fique em branco. O script também limpará os e-mails temporários existentes, definindo-os como nulos.
  **Impacto:** O campo de e-mail não será mais obrigatório ao criar um novo aluno. Os e-mails temporários existentes serão removidos.
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tabela `alunos`: A coluna `email` passará a aceitar valores nulos.
  ## Security Implications:
  - RLS Status: Sem alterações.
  - Policy Changes: Não.
  - Auth Requirements: Sem alterações.
*/
-- Passo 1: Remover a restrição NOT NULL da coluna de e-mail
ALTER TABLE public.alunos ALTER COLUMN email DROP NOT NULL;

-- Passo 2: Limpar os e-mails temporários existentes, definindo-os como NULL
UPDATE public.alunos
SET email = NULL
WHERE email LIKE 'placeholder-%@matchplay.com';
