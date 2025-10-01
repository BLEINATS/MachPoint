/*
  # [Structural] Cria o bucket para fotos das quadras

  ## Query Description: [Este script cria um novo bucket de armazenamento chamado 'quadra-photos' para armazenar as imagens das quadras. O bucket é configurado como público para que as imagens possam ser acessadas facilmente pela aplicação. Também define as permissões para que usuários autenticados possam fazer upload, visualizar, atualizar e deletar fotos.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Bucket: quadra-photos

  ## Security Implications:
  - RLS Status: N/A (Storage)
  - Policy Changes: Yes (Storage policies)
  - Auth Requirements: authenticated users
*/
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quadra-photos', 'quadra-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Permissões para o bucket
CREATE POLICY "Quadra Photos Select Policy" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'quadra-photos');
CREATE POLICY "Quadra Photos Insert Policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quadra-photos');
CREATE POLICY "Quadra Photos Update Policy" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'quadra-photos');
CREATE POLICY "Quadra Photos Delete Policy" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'quadra-photos');
