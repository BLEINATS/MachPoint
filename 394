/*
          # [SECURITY] Set Search Path for Functions
          [This operation enhances security by setting a fixed `search_path` for multiple database functions. This prevents potential hijacking attacks by ensuring that functions resolve to objects in expected schemas (`public`, `extensions`) and not malicious ones that might be created by other users.]

          ## Query Description: [This script modifies the configuration of existing database functions to improve security. It does not alter the logic or data structures. The changes are safe and reversible.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [
            - `add_gamification_points(uuid, integer, text)`
            - `handle_reservation_completion()`
          ]
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None. This is a metadata change with no performance overhead.]
          */
ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text) SET search_path = public, extensions;

ALTER FUNCTION public.handle_reservation_completion() SET search_path = public, extensions;
