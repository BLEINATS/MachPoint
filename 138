/*
          # Fix Ambiguous Function `create_client_reservation_atomic`
          Removes a duplicate database function that was causing "Could not choose the best candidate function" errors during reservation creation by clients.

          ## Query Description:
          This operation safely removes an outdated and incorrect version of the `create_client_reservation_atomic` function. This duplicate function was defined with a generic `text` parameter for the payment status, creating a conflict with the correct version that uses a specific `payment_status_enum` type. Removing this duplicate resolves the ambiguity and allows the database to correctly select the right function, fixing the reservation creation process for clients. This change does not affect any existing data.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Function Dropped: `public.create_client_reservation_atomic(..., p_payment_status text, ...)`
          
          ## Security Implications:
          - RLS Status: Not applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: None. Fixes a blocking error.
          */

DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status text,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
);

-- This is a fallback in case the function was created without named parameters.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    uuid, 
    uuid, 
    date, 
    time without time zone, 
    time without time zone, 
    numeric, 
    text, -- This is the parameter causing ambiguity
    text, 
    numeric, 
    jsonb, 
    text, 
    text
);
