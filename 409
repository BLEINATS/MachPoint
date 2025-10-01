/*
# [Fix] Create Payment Status Enum Type
This migration creates the missing `payment_status_enum` type and ensures the `reservas` table uses it correctly. This fixes errors related to this missing type.

## Query Description:
This operation defines a new data type (`payment_status_enum`) for managing payment statuses and alters the `reservas` table to use this new type for the `payment_status` column. This change enforces data consistency, ensuring that only predefined values ('pago', 'pendente', 'parcialmente_pago') can be stored. Existing text values in the column will be converted to the new enum type.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Creates Type**: `public.payment_status_enum`
- **Alters Table**: `public.reservas`
  - **Alters Column**: `payment_status` to use the new enum type.

## Security Implications:
- RLS Status: Not changed.
- Policy Changes: No.
- Auth Requirements: None.

## Performance Impact:
- Indexes: No change.
- Triggers: No change.
- Estimated Impact: Low. The operation might cause a brief lock on the `reservas` table during the type conversion.
*/

-- Step 1: Create the custom ENUM type for payment status if it doesn't exist.
-- The error "type public.payment_status_enum does not exist" indicates it's missing.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE public.payment_status_enum AS ENUM ('pago', 'pendente', 'parcialmente_pago');
    END IF;
END$$;

-- Step 2: Alter the 'reservas' table to use the new enum type for the 'payment_status' column.
-- This assumes the column exists and is of a text-compatible type.
-- The `USING` clause safely converts existing text values to the new enum type.
ALTER TABLE public.reservas
ALTER COLUMN payment_status TYPE public.payment_status_enum
USING payment_status::text::public.payment_status_enum;
