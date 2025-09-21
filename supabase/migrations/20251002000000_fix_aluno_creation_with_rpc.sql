/*
# [Function and RLS Cleanup] Create secure function to create aluno profiles
This migration replaces the previous RLS policy-based approach with a more robust and secure SECURITY DEFINER function.

## Query Description:
This migration performs two actions:
1. Drops the RLS policy "Allow users to create their own aluno profile" which was causing issues.
2. Creates a new function `ensure_aluno_profile_exists` that securely creates an 'aluno' record for the calling user if one doesn't exist. This function runs with elevated privileges but is safe because it operates strictly on the authenticated user's ID (`auth.uid()`). This is the standard and recommended Supabase pattern for this type of operation.

This change will permanently fix the "row-level security policy" error when new clients make their first reservation.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (The old policy is dropped, but the function can be dropped to reverse the creation)

## Structure Details:
- Table: `public.alunos`
- Policy Dropped: "Allow users to create their own aluno profile"
- Function Created: `public.ensure_aluno_profile_exists(target_arena_id uuid)`

## Security Implications:
- RLS Status: Modifies RLS configuration by removing a policy.
- Policy Changes: Yes (DROP)
- Auth Requirements: User must be authenticated to call the new function.
- Search Path: The new function explicitly sets a secure `search_path` to address the "Function Search Path Mutable" security advisory.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low.
*/

-- Step 1: Drop the old, problematic RLS policy.
DROP POLICY IF EXISTS "Allow users to create their own aluno profile" ON public.alunos;

-- Step 2: Create the new, secure function to handle aluno profile creation.
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(target_arena_id uuid)
RETURNS public.alunos
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path to address the security advisory
SET search_path = public
AS $$
DECLARE
  calling_user_id uuid;
  user_profile public.profiles;
  aluno_record public.alunos;
BEGIN
  -- Get the user ID of the person calling the function
  calling_user_id := auth.uid();

  -- If the user is not authenticated, raise an error
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated.';
  END IF;

  -- Check if an 'aluno' record already exists for this user in this arena
  SELECT *
  INTO aluno_record
  FROM public.alunos
  WHERE profile_id = calling_user_id AND arena_id = target_arena_id;

  -- If it exists, return it
  IF aluno_record IS NOT NULL THEN
    RETURN aluno_record;
  END IF;

  -- If not, get the user's profile details from the public.profiles table
  SELECT *
  INTO user_profile
  FROM public.profiles
  WHERE id = calling_user_id;

  -- If profile doesn't exist, we can't proceed
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found for id %', calling_user_id;
  END IF;

  -- Create the new 'aluno' record
  INSERT INTO public.alunos (profile_id, arena_id, name, email, status, plan_name, join_date)
  VALUES (
    calling_user_id,
    target_arena_id,
    user_profile.name,
    user_profile.email,
    'ativo',
    'Avulso',
    CURRENT_DATE
  )
  RETURNING * INTO aluno_record;

  RETURN aluno_record;
END;
$$;
