/*
# [SECURITY] Set search_path for functions

This migration enhances security by explicitly setting the search_path for several functions. This prevents potential hijacking attacks by ensuring that only trusted schemas are used for function execution.

## Query Description:
- **Safety:** This is a safe, non-destructive operation.
- **Impact:** No data will be changed. Function behavior remains the same, but security is improved.
- **Risk:** Low. This is a standard security best practice.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function again)

## Structure Details:
- Alters `add_credit_to_aluno(uuid, uuid, numeric)`
- Alters `handle_client_cancellation_final(uuid)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: "Function Search Path Mutable" warning by preventing search path hijacking.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Set a secure search path for the add_credit_to_aluno function
ALTER FUNCTION public.add_credit_to_aluno(uuid, uuid, numeric)
SET search_path = '';

-- Set a secure search path for the handle_client_cancellation_final function
ALTER FUNCTION public.handle_client_cancellation_final(uuid)
SET search_path = '';
