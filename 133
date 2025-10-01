/*
  # [Criação do Bucket de Logos da Arena]
  Cria um bucket no Supabase Storage chamado 'arena-logos' para armazenar as imagens de logo das arenas e configura as políticas de segurança.
  ## Query Description: [Este script cria um novo bucket de armazenamento chamado 'arena-logos' e o torna público. Em seguida, ele define políticas de Segurança em Nível de Linha (RLS) para controlar o acesso. As políticas garantem que: 1. Qualquer pessoa pode visualizar os logos. 2. Apenas o proprietário (admin) de uma arena pode enviar, atualizar ou deletar o logo correspondente à sua arena. Isso é feito verificando se o ID do usuário autenticado corresponde ao 'owner_id' da arena.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Bucket afetado: `storage.objects` para o bucket `arena-logos`
  - Políticas afetadas: RLS em `storage.objects` para o bucket `arena-logos`
  ## Security Implications:
  - RLS Status: As políticas serão criadas para o bucket `arena-logos`.
  - Policy Changes: Sim, novas políticas de acesso para o bucket.
  - Auth Requirements: Acesso de administrador para executar.
  ## Performance Impact:
  - Estimated Impact: Baixo.
*/
-- 1. Cria o bucket 'arena-logos' e o torna público
INSERT INTO storage.buckets (id, name, public)
VALUES ('arena-logos', 'arena-logos', true)
ON CONFLICT (id) DO NOTHING;
-- 2. Política para permitir visualização pública dos logos
CREATE POLICY "Arena logos are publicly-accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'arena-logos' );
-- 3. Política para permitir que o dono da arena envie um logo
CREATE POLICY "Arena owners can upload a logo."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'arena-logos' AND
    (select owner_id from public.arenas where id = (storage.foldername(name))[1]::uuid) = auth.uid()
  );
-- 4. Política para permitir que o dono da arena atualize seu próprio logo
CREATE POLICY "Arena owners can update their own logo."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'arena-logos' AND
    (select owner_id from public.arenas where id = (storage.foldername(name))[1]::uuid) = auth.uid()
  );
-- 5. Política para permitir que o dono da arena delete seu próprio logo
CREATE POLICY "Arena owners can delete their own logo."
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'arena-logos' AND
    (select owner_id from public.arenas where id = (storage.foldername(name))[1]::uuid) = auth.uid()
  );
