/*
  # [Security Hardening] Set search_path for handle_new_notification
  [This operation secures the function against potential search_path hijacking by explicitly setting its execution context.]

  ## Query Description: [This operation will update an existing database function to improve its security. It sets a fixed `search_path` to prevent unauthorized code execution. This change does not affect application functionality but enhances protection against certain types of attacks.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: `public.handle_new_notification`
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Not Applicable]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible performance impact.]
*/
ALTER FUNCTION public.handle_new_notification() SET search_path = public;
