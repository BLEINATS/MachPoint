/*
# [SECURITY] Secure seed_gamification_defaults function
This migration enhances the security of the `seed_gamification_defaults` function by explicitly setting its `search_path`.

## Query Description:
- **Safety:** This is a safe, non-destructive operation.
- **Impact:** It prevents potential "search path hijacking" vulnerabilities by ensuring the function only looks for objects in the 'public' schema. No data or functionality will be changed.
- **Recommendation:** This is a recommended security best practice for all PostgreSQL functions.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by resetting the search_path)

## Structure Details:
- Function being modified: `public.seed_gamification_defaults(uuid)`

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: Not applicable

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/
ALTER FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
SET search_path = 'public';
