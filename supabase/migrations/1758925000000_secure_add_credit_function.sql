/*
          # [SECURITY] Secure add_credit_to_aluno function
          This migration secures the `add_credit_to_aluno` function by explicitly setting the `search_path`. This is a best practice recommended by Supabase to prevent potential security vulnerabilities related to search path hijacking. This change does not affect the function's logic or behavior.

          ## Query Description: [This operation modifies an existing database function to enhance security by setting a fixed `search_path`. It does not alter data, but ensures the function operates in a predictable and secure schema context.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function `public.add_credit_to_aluno(uuid, uuid, numeric)` will be replaced with a more secure version.
          
          ## Security Implications:
          - RLS Status: [Not Changed]
          - Policy Changes: [No]
          - Auth Requirements: [Not Changed]
          - Mitigates: Search path hijacking vulnerability.
          
          ## Performance Impact:
          - Indexes: [Not Changed]
          - Triggers: [Not Changed]
          - Estimated Impact: [None]
          */
CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(aluno_id_to_update uuid, arena_id_to_check uuid, amount_to_add numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$function$
;
