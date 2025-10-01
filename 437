/*
          # [Security Enhancement] Set Search Path for Functions
          [This operation enhances security by setting a fixed search_path for several database functions, mitigating potential risks associated with mutable search paths.]

          ## Query Description: [This operation alters existing database functions to explicitly define their search path. This is a safe, non-destructive security best practice that prevents certain types of SQL injection attacks. It does not affect user data or application functionality.]

          ## Metadata:
          - Schema-Category: ["Security", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Functions affected: public.add_gamification_points, public.handle_client_cancellation_final

          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]

          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None. This is a metadata change that improves security without performance overhead.]
          */
ALTER FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text) SET search_path = public;

ALTER FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid) SET search_path = public;
