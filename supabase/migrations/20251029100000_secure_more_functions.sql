/*
          # [Schema Security] Secure Function Search Paths
          [This operation updates several database functions to explicitly set their `search_path`. This is a security best practice that prevents potential vulnerabilities by ensuring functions do not accidentally use objects from unintended schemas.]

          ## Query Description: [This operation will redefine existing functions to include a secure `search_path`. It is a safe, non-destructive update that improves security without affecting application logic or data. No data will be lost, and the changes are reversible by redeploying the previous function versions.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions being updated:
            - `ensure_aluno_profile(uuid, uuid)`
            - `handle_new_user_profile()`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None. This is a metadata change to function definitions and has no performance impact on query execution.]
          */

-- Drop and recreate ensure_aluno_profile with secure search_path
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_profile_id uuid, p_arena_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_aluno_id uuid;
  v_profile record;
BEGIN
  -- Find existing aluno profile
  SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

  -- If not found, create one
  IF v_aluno_id IS NULL THEN
    -- Get profile details
    SELECT name, email, phone INTO v_profile FROM public.profiles WHERE id = p_profile_id;
    
    -- Insert into alunos table
    INSERT INTO public.alunos (profile_id, arena_id, name, email, phone, status, join_date)
    VALUES (p_profile_id, p_arena_id, v_profile.name, v_profile.email, v_profile.phone, 'ativo', CURRENT_DATE)
    RETURNING id INTO v_aluno_id;
  END IF;

  RETURN v_aluno_id;
END;
$$;

-- Drop and recreate handle_new_user_profile with secure search_path
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  RETURN new;
END;
$$;
