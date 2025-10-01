/*
  # [Add Aluno RLS Policies]
  This migration adds Row-Level Security (RLS) policies to the `alunos` table.
  These policies allow authenticated users to create, view, and update their own records,
  which is essential for clients making their first reservation at an arena.

  ## Query Description:
  - This operation adds security policies and does not modify or delete existing data.
  - It is a safe, structural change that enhances security by explicitly defining data access rules.
  - It ensures a user can only interact with their own `aluno` records by checking `auth.uid()`.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the policies can be dropped)

  ## Structure Details:
  - Table: `public.alunos`
  - Operation: `CREATE POLICY`

  ## Security Implications:
  - RLS Status: Ensures RLS is enabled on `public.alunos` and grants necessary permissions.
  - Policy Changes: Yes, adds new policies for INSERT, SELECT, and UPDATE.
  - Auth Requirements: The user must be authenticated.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. RLS checks are very efficient.
*/

-- Ensure RLS is enabled on the table. This is idempotent.
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to make the script re-runnable.
DROP POLICY IF EXISTS "Allow authenticated users to create their own aluno profile" ON public.alunos;
DROP POLICY IF EXISTS "Allow authenticated users to view their own aluno profiles" ON public.alunos;
DROP POLICY IF EXISTS "Allow authenticated users to update their own aluno profiles" ON public.alunos;

-- Create the policy to allow users to insert their own 'aluno' record.
CREATE POLICY "Allow authenticated users to create their own aluno profile"
ON public.alunos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Add a policy to allow users to view their own 'aluno' records.
CREATE POLICY "Allow authenticated users to view their own aluno profiles"
ON public.alunos
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- Add a policy to allow users to update their own 'aluno' records.
CREATE POLICY "Allow authenticated users to update their own aluno profiles"
ON public.alunos
FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);
