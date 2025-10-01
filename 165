/*
          # [Schema Security] Fix Function Search Path (Batch 5)
          [This operation enhances security by explicitly setting the search_path for several database functions, mitigating potential risks identified by Supabase security advisories.]

          ## Query Description: [This operation will alter existing database functions to set a fixed search_path. This is a safe, non-destructive change that improves security by preventing potential hijacking of function calls. It has no impact on existing data or application functionality.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions being altered:
            - `add_credit_to_aluno`
            - `handle_new_user`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None. This is a security and stability improvement with no performance overhead.]
          */

-- Fix for function: add_credit_to_aluno
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

-- Fix for function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_client_type TEXT;
BEGIN
  v_role := new.raw_user_meta_data->>'role';
  v_name := new.raw_user_meta_data->>'name';
  v_client_type := new.raw_user_meta_data->>'clientType';

  INSERT INTO public.profiles (id, email, name, role, clientType)
  VALUES (new.id, new.email, v_name, v_role, v_client_type);
  
  RETURN new;
END;
$$;
