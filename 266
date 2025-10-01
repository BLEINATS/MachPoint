/*
          # [SECURITY] Enable RLS for Credit Transactions
          This migration enables Row-Level Security (RLS) on the `credit_transactions` table and adds policies to ensure that users can only view their own transaction history and arena owners can view all transactions in their arena. This is a critical security and privacy enhancement.

          ## Query Description: [This operation secures the credit transaction history. It enables RLS and creates policies that allow users to select only the rows that belong to them, and arena owners to see all transactions in their arena. This prevents users from seeing each other's financial data.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table `credit_transactions`: Enables RLS and adds new SELECT policies.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This policy relies on `auth.uid()` to identify the currently logged-in user.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. RLS may add a minor overhead to queries on this table, but it's essential for security.
          */

-- 1. Enable RLS on the credit_transactions table
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy to allow users to view their own credit transactions
-- This policy checks if the logged-in user's ID matches the profile_id of the 'aluno' associated with the transaction.
CREATE POLICY "Allow users to view their own credit transactions"
ON public.credit_transactions
FOR SELECT
USING (
  auth.uid() = (SELECT profile_id FROM public.alunos WHERE id = credit_transactions.aluno_id)
);

-- 3. Create a policy to allow the owner of the arena to view all transactions in their arena.
-- This is important for the admin dashboard functionality.
CREATE POLICY "Allow arena owners to view transactions in their arena"
ON public.credit_transactions
FOR SELECT
USING (
  auth.uid() = (SELECT owner_id FROM public.arenas WHERE id = credit_transactions.arena_id)
);
