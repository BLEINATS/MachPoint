/*
# [Schema Fix] Rename column in gamification_point_transactions
This operation renames the 'amount' column to 'points' in the 'gamification_point_transactions' table to align the database schema with the application's functions and type definitions. This will resolve the "column points does not exist" error.

## Query Description: [This is a safe, non-destructive schema change. It only renames a column and does not affect any existing data within that column. This change is required to fix a bug preventing point adjustments and transaction logging.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables affected: public.gamification_point_transactions
- Columns affected: Renames 'amount' to 'points'.

## Security Implications:
- RLS Status: [No Change]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/
ALTER TABLE public.gamification_point_transactions RENAME COLUMN amount TO points;
