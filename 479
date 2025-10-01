/*
          # [Fix] Remove Duplicate Reservation Function
          This operation removes a duplicate and incorrectly typed version of the function responsible for creating client reservations. This will resolve an ambiguity error that prevents new reservations from being created by clients.

          ## Query Description: [This operation will remove a conflicting database function. It is a safe cleanup operation and will not affect any existing data. It is necessary to restore the reservation functionality for clients.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Function `public.create_client_reservation_atomic` with text parameters will be dropped.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Admin]
          
          ## Performance Impact:
          - Indexes: [Not Applicable]
          - Triggers: [Not Applicable]
          - Estimated Impact: [None]
          */
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, text, text, integer, jsonb, text, text);
