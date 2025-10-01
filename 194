/*
      # [Fix Function Search Path]
      [This operation sets a secure search_path for the 'log_cancellation_credit_in_history' function to mitigate a security advisory.]

      ## Query Description: [This operation alters an existing database function to set a fixed, secure search path. It helps prevent potential security vulnerabilities related to search path hijacking, as flagged by Supabase security advisories. This change does not affect the function's logic or data.]
      
      ## Metadata:
      - Schema-Category: ["Safe", "Structural"]
      - Impact-Level: ["Low"]
      - Requires-Backup: [false]
      - Reversible: [true]
      
      ## Structure Details:
      - Function(s) affected: public.log_cancellation_credit_in_history(uuid, uuid, numeric, uuid)
      
      ## Security Implications:
      - RLS Status: [Not Applicable]
      - Policy Changes: [No]
      - Auth Requirements: [None]
      
      ## Performance Impact:
      - Indexes: [Not Applicable]
      - Triggers: [Not Applicable]
      - Estimated Impact: [None. This is a metadata change to a function definition.]
    */
    ALTER FUNCTION public.log_cancellation_credit_in_history(uuid, uuid, numeric, uuid) SET search_path = public;
