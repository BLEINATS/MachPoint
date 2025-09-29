/*
# [Fix] Recreate Missing New User Profile Handler
[This script recreates the essential function and trigger responsible for creating a user profile in the 'public.profiles' table whenever a new user signs up via Supabase Auth. This fixes the "function does not exist" error.]

## Query Description: [This operation is safe and structural. It ensures that new user registrations will function correctly by creating their corresponding profile entries. It will not affect existing users or data. It first creates a 'user_role' type if it's missing, then defines the function to create a profile, and finally attaches this function to a trigger on the user authentication table.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Types: `public.user_role` (if not exists)
- Functions: `public.handle_new_user_profile`
- Triggers: `on_auth_user_created` on `auth.users`

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [Adds a trigger to auth.users, which has a negligible performance impact on user creation.]
- Estimated Impact: [Low. Only affects new user sign-ups.]
*/

-- Create the user_role enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('cliente', 'admin_arena');
    END IF;
END$$;


-- Create the function to handle new user profiles
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Drop the existing trigger if it exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger to run the function after a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
