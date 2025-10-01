/*
# [SECURITY] Set Search Path for Core Functions
This migration enhances security by setting a fixed `search_path` for critical database functions, mitigating the risk of search path hijacking attacks as flagged by Supabase security advisories.

## Query Description:
- This operation alters existing database functions to explicitly set their `search_path` to `'public'`.
- It does not change the logic of the functions, only their security configuration.
- There is no impact on existing data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function to reset the search_path)

## Structure Details:
- Functions potentially affected:
  - `public.cancel_booking(uuid)`
  - `public.add_credit(uuid, integer)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Unchanged
- Mitigates: `Function Search Path Mutable` warning by preventing unauthorized schema manipulation within the function's execution context.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a metadata change.
*/

-- Secures the booking cancellation function
ALTER FUNCTION public.cancel_booking(booking_id uuid)
SET search_path = 'public';

-- Secures the credit addition function
ALTER FUNCTION public.add_credit(p_aluno_id uuid, p_amount integer)
SET search_path = 'public';
