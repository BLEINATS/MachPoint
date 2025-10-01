/*
  # [Criação do Bucket de Avatares]
  Cria um bucket no Supabase Storage chamado 'avatars' para armazenar as fotos de perfil dos usuários e configura as políticas de segurança.
  ## Query Description: [Este script cria um novo bucket de armazenamento chamado 'avatars' e o torna público. Em seguida, ele define políticas de Segurança em Nível de Linha (RLS) para controlar o acesso. As políticas garantem que: 1. Qualquer pessoa pode visualizar os avatares (necessário para exibi-los no aplicativo). 2. Apenas usuários autenticados podem enviar (upload) novos avatares. 3. Usuários só podem atualizar ou deletar seus próprios avatares, garantindo que ninguém possa modificar a foto de outro usuário. Esta é uma operação estrutural e segura.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Bucket afetado: `storage.objects` para o bucket `avatars`
  - Políticas afetadas: RLS em `storage.objects` para o bucket `avatars`
  ## Security Implications:
  - RLS Status: As políticas serão criadas para o bucket `avatars`.
  - Policy Changes: Sim, novas políticas de acesso para o bucket.
  - Auth Requirements: Acesso de administrador para executar.
  ## Performance Impact:
  - Estimated Impact: Baixo.
*/
-- 1. Cria o bucket 'avatars' e o torna público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
-- 2. Política para permitir visualização pública de avatares
CREATE POLICY "Avatar images are publicly-accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );
-- 3. Política para permitir que usuários autenticados enviem avatares
CREATE POLICY "Authenticated users can upload an avatar."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
-- 4. Política para permitir que usuários atualizem seu próprio avatar
CREATE POLICY "Authenticated users can update their own avatar."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
-- 5. Política para permitir que usuários deletem seu próprio avatar
CREATE POLICY "Authenticated users can delete their own avatar."
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
