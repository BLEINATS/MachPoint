/*
          # [SECURITY] Set Search Path for Core Functions
          [This operation enhances security by setting a fixed search_path for the `add_credit_to_aluno` and `ensure_aluno_profile` functions. This prevents potential hijacking attacks by ensuring that only objects from the specified schemas are resolved, mitigating risks associated with mutable search paths.]

          ## Query Description: [This operation will alter two existing database functions to improve their security posture. It does not change their functionality or impact existing data. No backup is required as this is a safe, metadata-only change.]
          
          ## Metadata:
          - Schema-Category: ["Safe", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions being altered:
            - `public.add_credit_to_aluno(uuid, uuid, numeric)`
            - `public.ensure_aluno_profile(uuid, uuid)`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Not Applicable]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None. This is a metadata change with no performance overhead.]
          */

ALTER FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric) SET search_path = '';
ALTER FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid) SET search_path = '';
