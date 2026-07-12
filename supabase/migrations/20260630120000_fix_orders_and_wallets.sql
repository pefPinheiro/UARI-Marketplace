-- ========================================================
-- CORREÇÃO E COMPLEMENTAÇÃO DO SCHEMA DE BANCO DE DADOS
-- ========================================================

-- 1. Remoção preventiva das tabelas antigas (CASCADE garante limpeza total)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;

-- 2. Remoção de tipos enum caso existam para recriação limpa
DROP TYPE IF EXISTS order_status CASCADE;

-- 3. Criação do tipo ENUM para o status dos pedidos reais
CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'paid',
    'ready_for_pickup',
    'completed',
    'disputed',
    'refunded'
);

-- 4. Criação da tabela de Pedidos Reais (orders) conforme esperado pela aplicação
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (discount >= 0),
    platform_fee NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (platform_fee >= 0),
    store_net NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (store_net >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status order_status DEFAULT 'pending_payment' NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card')),
    handshake_qr_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 5. Criação da tabela de Itens do Pedido (order_items)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- 6. Criação da tabela de Carteiras dos Lojistas (wallets)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    available_balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    escrow_balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_wallets_store ON wallets(store_id);

-- 7. Criação da tabela de Solicitações de Saques (withdrawals)
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    pix_key TEXT NOT NULL,
    status TEXT DEFAULT 'requested' NOT NULL CHECK (status IN ('requested', 'completed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_withdrawals_store ON withdrawals(store_id);

-- 8. Criação da tabela de Histórico de Transações da Carteira (wallet_transactions)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('credit_sale', 'debit_fee', 'withdrawal', 'refund')),
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);

-- ========================================================
-- CONFIGURAÇÃO DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Políticas para orders
CREATE POLICY "Leitura de pedidos próprios (clientes)" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Leitura de pedidos da loja (lojistas)" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Clientes inserem seus próprios pedidos" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lojistas atualizam status do pedido de sua loja" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
        )
    );

-- RLS Políticas para order_items
CREATE POLICY "Leitura de itens do pedido próprio" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id AND (
                orders.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM stores
                    WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Clientes inserem itens de pedido" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

-- RLS Políticas para wallets
CREATE POLICY "Lojistas acessam carteira da sua loja" ON wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = wallets.store_id AND stores.owner_id = auth.uid()
        )
    );

-- RLS Políticas para withdrawals
CREATE POLICY "Lojistas visualizam saques de sua loja" ON withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = withdrawals.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Lojistas solicitam saques para sua loja" ON withdrawals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = withdrawals.store_id AND stores.owner_id = auth.uid()
        )
    );

-- RLS Políticas para wallet_transactions
CREATE POLICY "Lojistas veem transações de sua carteira" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets
            JOIN stores ON stores.id = wallets.store_id
            WHERE wallets.id = wallet_transactions.wallet_id AND stores.owner_id = auth.uid()
        )
    );

-- ========================================================
-- AUTOMATIZAÇÃO: TRIGGER PARA CRIAR CARTEIRA AUTOMÁTICA
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (store_id, available_balance, escrow_balance)
    VALUES (new.id, 0.00, 0.00)
    ON CONFLICT (store_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_store_created ON public.stores;
CREATE TRIGGER on_store_created
    AFTER INSERT ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- Garante carteiras para lojas existentes sem carteira
INSERT INTO public.wallets (store_id, available_balance, escrow_balance)
SELECT id, 0.00, 0.00 FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

-- ========================================================
-- CONFIGURAÇÃO DE STORAGE BUCKET E RLS POLICIES
-- ========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Remove políticas de storage antigas se existirem
DROP POLICY IF EXISTS "Acesso público a imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Lojistas podem fazer upload de imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Lojistas podem deletar suas imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Lojistas podem atualizar suas imagens de produtos" ON storage.objects;

-- Cria políticas para o bucket "products"
CREATE POLICY "Acesso público a imagens de produtos" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Lojistas podem fazer upload de imagens de produtos" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'products' AND
        (split_part(name, '/', 1)) IN (
            SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Lojistas podem atualizar suas imagens de produtos" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'products' AND
        (split_part(name, '/', 1)) IN (
            SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Lojistas podem deletar suas imagens de produtos" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'products' AND
        (split_part(name, '/', 1)) IN (
            SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
        )
    );

-- ========================================================
-- GARANTIA DA COLUNA ATTRIBUTES EM PRODUCTS E RECARGA DE SCHEMA
-- ========================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Notifica o PostgREST para limpar o cache e recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
