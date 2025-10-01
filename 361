/*
  # [SECURITY] Set Search Path for Core Functions
  [This migration enhances security by explicitly setting the search_path for several functions, mitigating potential risks associated with mutable search paths.]

  ## Query Description: [This operation updates the definitions of `add_credit_to_aluno`, `create_my_aluno_profile`, and `is_arena_admin` functions to include `SET search_path = 'public'`. This is a security best practice that prevents certain types of attacks by ensuring functions resolve objects within the expected schema. There is no impact on existing data or functionality.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Functions affected: `add_credit_to_aluno`, `create_my_aluno_profile`, `is_arena_admin`
  
  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [No Change]
  
  ## Performance Impact:
  - Indexes: [No Change]
  - Triggers: [No Change]
  - Estimated Impact: [None]
*/

-- Function: add_credit_to_aluno
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.alunos
  SET credit_balance = credit_balance + amount_to_add
  WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;

-- Function: create_my_aluno_profile
CREATE OR REPLACE FUNCTION public.create_my_aluno_profile(p_arena_id uuid, p_name text, p_phone text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
BEGIN
  -- Check if an 'aluno' record already exists for this profile_id and arena_id
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

  -- If it doesn't exist, create it
  IF v_aluno_id IS NULL THEN
    INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, join_date, plan_name)
    VALUES (p_arena_id, v_profile_id, p_name, p_phone, 'ativo', NOW(), 'Avulso')
    RETURNING id INTO v_aluno_id;
    
    -- Also create a membership link
    INSERT INTO public.arena_memberships (profile_id, arena_id)
    VALUES (v_profile_id, p_arena_id)
    ON CONFLICT (profile_id, arena_id) DO NOTHING;
  END IF;

  RETURN v_aluno_id;
END;
$$;

-- Function: is_arena_admin
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_owner_id uuid;
BEGIN
    SELECT owner_id INTO v_owner_id
    FROM public.arenas
    WHERE id = p_arena_id;

    RETURN v_user_id = v_owner_id;
END;
$$;
