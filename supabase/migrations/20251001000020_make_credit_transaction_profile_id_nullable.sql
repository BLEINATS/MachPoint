/*
# [Structural] Make profile_id optional in credit_transactions
This migration makes the `profile_id` column in the `credit_transactions` table optional (nullable). This is to prevent errors when recording credit transactions for clients who were created manually or do not have an associated user profile, which was causing cancellations to fail.

## Query Description:
- **Operation**: Alters the `credit_transactions` table.
- **Impact**: The `profile_id` column will no longer be mandatory. This increases flexibility but relies on `aluno_id` to be the primary link for credit.
- **Safety**: This is a safe, non-destructive operation. No data will be lost.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (ALTER TABLE ... SET NOT NULL)

## Structure Details:
- Table: `public.credit_transactions`
- Column: `profile_id`
- Change: `NOT NULL` constraint is removed.

## Security Implications:
- RLS Status: Unchanged.
- Policy Changes: No.
- Auth Requirements: None for this migration.

## Performance Impact:
- Indexes: Unchanged.
- Triggers: Unchanged.
- Estimated Impact: Negligible.
*/

ALTER TABLE public.credit_transactions
ALTER COLUMN profile_id DROP NOT NULL;
