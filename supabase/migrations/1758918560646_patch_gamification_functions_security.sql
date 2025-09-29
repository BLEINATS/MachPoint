/*
# [SECURITY] Patch Search Path for Gamification Functions
This migration enhances security by explicitly setting the `search_path` for gamification-related functions. This prevents potential vulnerabilities where a function could be tricked into executing malicious code from an untrusted schema.

## Query Description:
This operation alters existing functions to set a secure `search_path`. This ensures that the functions do not accidentally execute code from untrusted schemas. This is a non-destructive security enhancement.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by resetting the search_path)

## Structure Details:
- Functions being altered:
  - `public.handle_reservation_completion()`
  - `public.add_gamification_points(uuid, integer, text)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None for this migration.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Sets the search path for the trigger function that handles logic after a reservation is completed.
ALTER FUNCTION public.handle_reservation_completion() SET search_path = public;

-- Sets the search path for the function that manually adds or removes gamification points.
ALTER FUNCTION public.add_gamification_points(uuid, integer, text) SET search_path = public;
