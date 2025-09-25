-- First, create the helper function to ensure an aluno profile exists.
/*
  # [Function] ensure_aluno_profile_exists
  [This function checks if an 'aluno' profile exists for a given user in a specific arena. If not, it creates one automatically.]

  ## Query Description: [This operation creates or replaces a database function. It is designed to be safe and will not delete any user data. It ensures that every client making a reservation has a corresponding 'aluno' record, which is crucial for tracking credits and history within an arena.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.ensure_aluno_profile_exists(uuid, uuid)
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [The function is called by other functions that should have appropriate security context (e.g., run as the authenticated user).]
  
  ## Performance Impact:
  - Indexes: [No changes]
  - Triggers: [No changes]
  - Estimated Impact: [Negligible. The function performs a simple check and an optional insert.]
*/
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(
    p_profile_id uuid,
    p_arena_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_exists boolean;
    v_profile_name text;
    v_profile_phone text;
BEGIN
    -- Check if an aluno profile already exists for this user in this arena
    SELECT EXISTS (
        SELECT 1
        FROM public.alunos
        WHERE profile_id = p_profile_id AND arena_id = p_arena_id
    ) INTO v_aluno_exists;

    -- If it doesn't exist, create it
    IF NOT v_aluno_exists THEN
        -- Get user's name and phone from the main profiles table
        SELECT name, phone
        INTO v_profile_name, v_profile_phone
        FROM public.profiles
        WHERE id = p_profile_id;

        -- Insert a new 'aluno' record with default values
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, plan_name, join_date, credit_balance)
        VALUES (
            p_profile_id,
            p_arena_id,
            v_profile_name,
            v_profile_phone,
            'ativo',
            'Avulso',
            CURRENT_DATE,
            0
        );
    END IF;
END;
$$;


-- Then, update the main reservation function to use the helper.
/*
  # [Function] create_client_reservation_atomic (Updated)
  [This function creates a client reservation atomically, ensuring an 'aluno' profile exists and all data is inserted in a single transaction.]

  ## Query Description: [This operation replaces the existing 'create_client_reservation_atomic' function to include a call to 'ensure_aluno_profile_exists'. This makes the reservation process more robust by preventing failures when a client makes their first booking. It is a safe, non-destructive change.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.create_client_reservation_atomic(...)
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [This function should be called by an authenticated user. It uses `auth.uid()` to securely identify the caller.]
  
  ## Performance Impact:
  - Indexes: [No changes]
  - Triggers: [No changes]
  - Estimated Impact: [Low. Adds one function call to the reservation process.]
*/
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Run as the calling user
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
BEGIN
    -- Step 1: Ensure an 'aluno' profile exists for the calling user in the target arena.
    PERFORM public.ensure_aluno_profile_exists(v_profile_id, p_arena_id);

    -- Step 2: Get the aluno_id for credit transaction purposes
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

    -- Step 3: Insert the reservation
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        date,
        start_time,
        end_time,
        total_price,
        payment_status,
        sport_type,
        credit_used,
        rented_items,
        clientName,
        clientPhone,
        status,
        type
    ) VALUES (
        p_arena_id,
        p_quadra_id,
        v_profile_id,
        p_date,
        p_start_time,
        p_end_time,
        p_total_price,
        p_payment_status,
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone,
        'confirmada',
        'avulsa'
    );

    -- Step 4: If credit was used, deduct it from the aluno's balance
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;
