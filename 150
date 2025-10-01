/*
# [Function Update] ensure_aluno_profile & handle_new_user
[This operation updates the 'ensure_aluno_profile' and 'handle_new_user' functions to set a secure search_path, preventing potential hijacking attacks.]

## Query Description: [Updates the functions to explicitly set the search path to 'public'. This is a security best practice that ensures the functions use the correct schemas and avoids executing malicious code from other paths. This change has no impact on data or functionality.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.ensure_aluno_profile(uuid)
- Function: public.handle_new_user()

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [authenticated, trigger]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

-- Fix for ensure_aluno_profile function
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(p_arena_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_profile_name text;
    v_profile_email text;
    v_profile_phone text;
BEGIN
    -- Check if an 'aluno' profile already exists for this user in this arena
    IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id) THEN
        -- Get user details from profiles table
        SELECT name, email, phone INTO v_profile_name, v_profile_email, v_profile_phone
        FROM public.profiles
        WHERE id = v_profile_id;

        -- Insert a new 'aluno' record
        INSERT INTO public.alunos (arena_id, profile_id, name, email, phone, status, plan_name, join_date)
        VALUES (
            p_arena_id,
            v_profile_id,
            v_profile_name,
            v_profile_email,
            v_profile_phone,
            'ativo',
            'Avulso',
            CURRENT_DATE
        );
    END IF;
END;
$$;
ALTER FUNCTION public.ensure_aluno_profile(uuid) SET search_path = public;

-- Fix for handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::text
  );
  
  IF (new.raw_user_meta_data->>'role')::text = 'admin_arena' THEN
    INSERT INTO public.arenas (owner_id, name, city, state, slug)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      'Cidade', -- Placeholder
      'UF', -- Placeholder
      (LOWER(regexp_replace(new.raw_user_meta_data->>'name', '[^a-zA-Z0-9]+', '-', 'g')))
    );
  END IF;
  
  RETURN new;
END;
$$;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
