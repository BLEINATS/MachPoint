/*
          # [Operation Name]
          Fix Client Reservation Function Ambiguity

          ## Query Description: [This operation removes a duplicate, incorrect version of the function used to create client reservations. An older version of the function was causing a conflict, preventing the system from choosing the correct one to execute. Removing the outdated version will resolve the error and allow client reservations to be created successfully again. This change is safe and does not affect any stored data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Removes the function `public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, public.payment_status_enum, text, numeric, jsonb, text, text)`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [None. This is a metadata change to resolve a function signature conflict.]
          */
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, public.payment_status_enum, text, numeric, jsonb, text, text);
