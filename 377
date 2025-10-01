/*
          # [Fix] Recreate Missing Profile Creation Function
          [This script recreates the essential function `handle_new_user_profile` and its associated trigger. This function is responsible for automatically creating a user profile in the `public.profiles` table whenever a new user signs up through Supabase Auth. The previous error indicated this function was missing, breaking the user creation flow.]

          ## Query Description: [This operation is safe and foundational. It ensures that new user accounts are correctly set up in the application's public schema, which is a standard and required practice for Supabase projects. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates or replaces the function `public.handle_new_user_profile`.
          - Creates or replaces the trigger `on_auth_user_created` on the `auth.users` table.
          - Ensures the `public.user_role` enum type exists.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [Adds a trigger to `auth.users`, which has a negligible performance impact on user creation.]
          - Estimated Impact: [Low]
          */

-- Step 1: Ensure the user_role enum type exists for profile creation.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('cliente', 'admin_arena');
    END IF;
END$$;


-- Step 2: Create or replace the function to handle new user profile creation.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role
  );
  return new;
end;
$$;

-- Step 3: Create or replace the trigger on the auth.users table.
-- This ensures the function is called automatically after a new user signs up.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
