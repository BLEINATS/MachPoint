/*
# [Security Hardening] Set Search Path for Core Functions
[This operation secures core functions by explicitly setting the `search_path`. This prevents potential security vulnerabilities related to search path hijacking, ensuring that the functions only access objects within the intended `public` schema.]

## Query Description: [This is a safe, non-destructive operation that enhances security. It modifies the definition of existing functions to make them more secure without altering their behavior or impacting any data. No backup is required.]

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions modified:
  - `public.add_credit_to_aluno(uuid, uuid, numeric)`
  - `public.handle_new_user_profile()`

## Security Implications:
- RLS Status: [No Change]
- Policy Changes: [No]
- Auth Requirements: [No Change]
- Mitigates: [Search Path Hijacking]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [Negligible. This is a metadata change to function definitions.]
*/

-- Secure add_credit_to_aluno function
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
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

-- Secure handle_new_user_profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (new.id, new.raw_user_meta_data->>'name', new.email, (new.raw_user_meta_data->>'role')::text::role_type);
    RETURN new;
END;
$$;
