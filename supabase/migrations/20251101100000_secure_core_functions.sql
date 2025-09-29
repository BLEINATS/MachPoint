/*
# [Security Hardening] Set Search Path for Core Functions
This migration enhances security by explicitly setting the `search_path` for several core database functions. This prevents potential vulnerabilities where a function could be tricked into executing code from an untrusted schema. This is a preventative security measure and does not change the function's behavior.

## Query Description:
- **Operation:** Alters existing database functions.
- **Impact:** Sets the `search_path` to `public` for the `add_gamification_points`, `seed_gamification_defaults`, and `ensure_aluno_profile` functions.
- **Safety:** This is a safe, non-destructive operation. It only modifies metadata and does not affect data or function logic.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unsetting the search_path)

## Structure Details:
- Functions affected:
  - `public.add_gamification_points(uuid, integer, text)`
  - `public.seed_gamification_defaults(uuid)`
  - `public.ensure_aluno_profile(uuid, uuid)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates `search_path` manipulation vulnerabilities for the targeted functions.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
SET search_path = public;

ALTER FUNCTION public.seed_gamification_defaults(p_arena_id uuid)
SET search_path = public;

ALTER FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
SET search_path = public;
