/*
# [Function] is_arena_admin
Verifica se o usuário autenticado é o proprietário (admin) de uma arena específica.
Esta é uma função de segurança essencial, usada em políticas de RLS (Row Level Security)
para garantir que apenas administradores possam ver ou modificar dados de suas respectivas arenas.
## Query Description: [This is a safe, non-destructive operation. It creates a helper function used for security checks. It does not alter any data and is crucial for fixing permission errors related to the notification system and other admin-only features.]
## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]
## Structure Details:
- Creates a new function: public.is_arena_admin(uuid)
## Security Implications:
- RLS Status: [N/A - This function is USED BY RLS policies]
- Policy Changes: [No - This function enables existing policies to work]
- Auth Requirements: [The function itself uses auth.uid() to check the current user.]
*/
CREATE OR REPLACE FUNCTION public.is_arena_admin(p_arena_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the currently authenticated user is the owner of the given arena
  RETURN EXISTS (
    SELECT 1
    FROM public.arenas
    WHERE id = p_arena_id AND owner_id = auth.uid()
  );
END;
$$;
-- Grant execute permission to authenticated users so RLS policies can use it.
GRANT EXECUTE ON FUNCTION public.is_arena_admin(uuid) TO authenticated;
