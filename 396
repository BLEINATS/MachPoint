/*
          # [SECURITY] Secure Function Search Paths (v4)
          [This operation updates existing database functions to enhance security by setting a fixed `search_path`. This prevents potential hijacking attacks by ensuring functions do not use a mutable search path.]

          ## Query Description: [This operation modifies the `is_arena_admin` and `add_gamification_points` functions to explicitly set the `search_path`. This is a non-destructive security enhancement and does not alter the function's logic or impact any data.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Modifies function: `public.is_arena_admin(uuid)`
          - Modifies function: `public.add_gamification_points(uuid, integer, text)`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */
ALTER FUNCTION public.is_arena_admin(arena_id uuid) SET search_path = '';

ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text) SET search_path = '';
