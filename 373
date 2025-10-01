/*
          # [Operation Name]
          Remove Conflicting Reservation Function

          ## Query Description: [This operation removes a duplicated and outdated database function (`create_client_reservation_atomic`) that was causing conflicts and preventing new reservations from being created. This cleanup is safe and ensures that only the correct version of the function is used by the application.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Removes one of a pair of overloaded functions to resolve ambiguity.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Not Applicable]
          - Triggers: [Not Applicable]
          - Estimated Impact: [This is a structural fix with no performance impact.]
          */

DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(p_arena_id uuid, p_quadra_id uuid, p_date date, p_start_time character varying, p_end_time character varying, p_total_price numeric, p_payment_status public.payment_status_enum, p_sport_type character varying, p_credit_to_use numeric, p_rented_items jsonb, p_client_name character varying, p_client_phone character varying);
