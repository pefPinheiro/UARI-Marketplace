-- ========================================================
-- ADICIONA PLAN_ID NA TABELA DE STORES (LOJAS)
-- ========================================================

ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Notifica o PostgREST para limpar o cache do schema
NOTIFY pgrst, 'reload schema';
