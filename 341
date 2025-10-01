/*
# [Security] Grant execute on ensure_my_aluno_profile
[This migration explicitly grants execute permission on the 'ensure_my_aluno_profile' function to the 'authenticated' role. This is a safeguard to ensure the function is callable by logged-in users, which might resolve schema cache or permission issues.]

## Query Description: [Grants the 'authenticated' role permission to execute the specified function. This is a non-destructive operation that enhances security configuration.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Affects function: public.ensure_my_aluno_profile

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Authenticated user]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [None]
*/
GRANT EXECUTE ON FUNCTION public.ensure_my_aluno_profile(uuid, uuid) TO authenticated;
