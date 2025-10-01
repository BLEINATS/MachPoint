/*
# [SECURITY] Set Search Path for More Functions
This migration enhances security by explicitly setting the `search_path` for several additional database functions. This mitigates potential hijacking attacks by ensuring functions only search for objects in trusted schemas.

## Query Description:
- This operation modifies the metadata of existing functions.
- It does not alter the logic or data of the functions themselves.
- The change is safe and reversible.

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies `search_path` for:
  - `handle_reservation_completion()`
  - `create_my_aluno_profile()`
  - `is_arena_admin(uuid)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Admin privileges required to run.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Set a secure search path for the function that handles reservation completion
ALTER FUNCTION public.handle_reservation_completion()
SET search_path = public, extensions;

-- Set a secure search path for the function that creates an "aluno" profile
ALTER FUNCTION public.create_my_aluno_profile()
SET search_path = public, extensions;

-- Set a secure search path for the function that checks admin status
ALTER FUNCTION public.is_arena_admin(uuid)
SET search_path = public, extensions;
