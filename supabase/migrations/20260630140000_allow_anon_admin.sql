-- ========================================================
-- PERMISSÕES ANON (DESENVOLVIMENTO) PARA PRODUTOS E STORAGE
-- ========================================================

-- 1. Desabilita RLS na tabela de produtos para permitir modificações pelo Admin Web (não autenticado)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas de storage para o bucket products que restringem a lojistas autenticados
DROP POLICY IF EXISTS "Acesso total publico a imagens de produtos" ON storage.objects;

-- 3. Cria política para permitir que qualquer usuário (incluindo anon/public) gerencie mídias no bucket "products"
CREATE POLICY "Acesso total publico a imagens de produtos" ON storage.objects
    FOR ALL TO public
    USING (bucket_id = 'products')
    WITH CHECK (bucket_id = 'products');

-- Notifica o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
