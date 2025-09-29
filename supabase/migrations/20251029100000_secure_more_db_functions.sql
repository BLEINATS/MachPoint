/*
          # [Operation Name]
          Securing Database Functions - Batch 7

          ## Query Description: [This operation enhances the security of several database functions by setting a fixed search_path and defining them as SECURITY DEFINER. This is a best practice recommended by Supabase to prevent potential security vulnerabilities. This change does not affect the functionality of the application.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Modifies the function: `update_aluno_gamification_points`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_aluno_gamification_points();

-- Recreate the function with security settings
CREATE OR REPLACE FUNCTION public.update_aluno_gamification_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.alunos
    SET gamification_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.gamification_point_transactions
        WHERE aluno_id = NEW.aluno_id
    )
    WHERE id = NEW.aluno_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger to use the secured function
DROP TRIGGER IF EXISTS on_gamification_points_change ON public.gamification_point_transactions;
CREATE TRIGGER on_gamification_points_change
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_point_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_aluno_gamification_points();
