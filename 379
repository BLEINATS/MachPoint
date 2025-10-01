/*
          # [SECURITY] Set Search Path for Core Functions
          This migration sets a fixed `search_path` for several critical functions to mitigate security risks, as recommended by Supabase security advisories.

          ## Query Description: 
          - This operation alters existing database functions (`add_credit_to_aluno`, `handle_client_cancellation_final`, `is_arena_admin`).
          - It sets the `search_path` to `public`, preventing potential hijacking attacks where a malicious user could create functions in other schemas that get executed unintentionally.
          - This change is purely for security hardening and does not affect the functions' logic or application data. No backup is required.
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by altering the function again to remove the SET clause)
          
          ## Structure Details:
          - Functions affected:
            - `public.add_credit_to_aluno(uuid, uuid, numeric)`
            - `public.handle_client_cancellation_final(uuid)`
            - `public.is_arena_admin(uuid)`
          
          ## Security Implications:
          - RLS Status: Not changed
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact. May slightly improve function execution speed by providing a direct search path.
          */

-- Set search_path for the function that adds credit to a student's account.
ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
SET search_path = public;

-- Set search_path for the final client cancellation handling function.
ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
SET search_path = public;

-- Set search_path for the function that checks if a user is an arena admin.
ALTER FUNCTION public.is_arena_admin(p_arena_id uuid)
SET search_path = public;
