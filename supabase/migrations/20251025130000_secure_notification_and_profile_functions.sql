/*
# [SECURITY] Set Search Path for Functions
[This operation secures database functions by explicitly setting the search_path. This prevents potential hijacking attacks by ensuring functions resolve objects in the intended schema ('public') first, mitigating risks associated with mutable search paths.]

## Query Description: [This operation modifies the configuration of existing database functions to enhance security. It sets a fixed `search_path` to `public`, preventing malicious users from manipulating function execution by creating objects with the same name in other schemas. This is a safe, non-destructive operation that does not alter data or logic.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[
  - Modifies function: `handle_new_reservation_notification()`,
  - Modifies function: `handle_new_user_profile()`
]

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Not Changed]
- Triggers: [Not Changed]
- Estimated Impact: [None. This is a metadata change with no performance overhead.]
*/
ALTER FUNCTION public.handle_new_reservation_notification()
SET search_path = 'public';

ALTER FUNCTION public.handle_new_user_profile()
SET search_path = 'public';
