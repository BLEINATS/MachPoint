/*
# [Constraint] Add Unique Phone Number Constraint per Arena
This migration adds a unique index to the `alunos` table. It ensures that no two clients/students within the same arena can have the same phone number. Phone numbers can be NULL, and NULL values are not considered unique, allowing multiple users without a phone number.

## Query Description: [This operation adds a data integrity rule. It will fail if you currently have duplicate phone numbers for different clients in the same arena. It is recommended to clean up duplicate phone numbers before applying this migration. This change prevents future data inconsistencies.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [true]
- Reversible: [false]

## Structure Details:
- Table: public.alunos
- Constraint Type: UNIQUE INDEX
- Columns: (arena_id, phone)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges required to alter table structure.]
*/
CREATE UNIQUE INDEX IF NOT EXISTS unique_phone_per_arena
ON public.alunos (arena_id, phone)
WHERE phone IS NOT NULL AND phone != '';
