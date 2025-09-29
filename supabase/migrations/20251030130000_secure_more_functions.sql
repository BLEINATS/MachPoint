/*
    # [SECURITY] Set Search Path for Functions
    This operation sets a secure search_path for several database functions to mitigate potential security risks, as flagged by Supabase security advisories.

    ## Query Description:
    - **Impact:** This is a low-impact, non-destructive change. It does not alter data or business logic.
    - **Risks:** Minimal. The operation only makes the functions more secure by explicitly defining their schema search path.
    - **Precautions:** No special precautions are needed.

    ## Metadata:
    - Schema-Category: "Security"
    - Impact-Level: "Low"
    - Requires-Backup: false
    - Reversible: true (by recreating the functions without the SET search_path clause)

    ## Structure Details:
    - Functions affected:
      - `handle_new_user()`
      - `add_credit_to_aluno(uuid, uuid, numeric)`
      - `is_arena_admin(uuid)`

    ## Security Implications:
    - RLS Status: Unchanged
    - Policy Changes: No
    - Auth Requirements: None
    - Mitigates: "Function Search Path Mutable" warning. By setting a fixed search_path, we prevent potential hijacking attacks where a malicious user could create objects in a temporary schema to alter function behavior.
    */

    -- Secure handle_new_user function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, email, role, "clientType")
      VALUES (
        new.id,
        new.raw_user_meta_data->>'name',
        new.email,
        (new.raw_user_meta_data->>'role')::public.user_role,
        (new.raw_user_meta_data->>'clientType')::public.client_type
      );
      
      -- If the user is an admin, create an arena for them
      IF (new.raw_user_meta_data->>'role')::public.user_role = 'admin_arena' THEN
        INSERT INTO public.arenas (owner_id, name, city, state)
        VALUES (new.id, new.raw_user_meta_data->>'name', 'Cidade', 'Estado');
      END IF;
      
      return new;
    END;
    $$;

    -- Secure add_credit_to_aluno function
    CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
        UPDATE public.alunos
        SET credit_balance = credit_balance + amount_to_add
        WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
    END;
    $$;

    -- Re-secure is_arena_admin function
    CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        is_admin boolean;
    BEGIN
        SELECT EXISTS (
            SELECT 1
            FROM public.arenas
            WHERE id = p_arena_id AND owner_id = auth.uid()
        ) INTO is_admin;
        
        RETURN is_admin;
    END;
    $$;
