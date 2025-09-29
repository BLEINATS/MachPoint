/*
# [Function Security Update]
This migration enhances the security of database functions by explicitly setting the search_path.

## Query Description: [This operation updates two functions, `handle_new_user_profile` and `add_credit_to_aluno`, to set a fixed `search_path`. This is a security best practice that prevents potential hijacking attacks by ensuring functions resolve objects (tables, types, etc.) from a trusted schema (`public`). The function logic remains unchanged. This is a safe, non-destructive operation.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions being updated:
  - `public.handle_new_user_profile()`
  - `public.add_credit_to_aluno(uuid, uuid, numeric)`

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [No]
- Mitigates: `search_path` hijacking vulnerabilities.

## Performance Impact:
- Indexes: [Not Changed]
- Triggers: [Not Changed]
- Estimated Impact: [None]
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;

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
