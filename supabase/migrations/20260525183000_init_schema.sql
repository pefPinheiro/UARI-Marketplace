-- ==========================================
-- 🌰 UÁRI MARKETPLACE - SCHEMA DE BANCO DE DADOS (VITRINE & GAMIFICAÇÃO)
-- ==========================================

-- Limpeza preventiva para permitir reexecução limpa do script sem erros de tipos duplicados
DROP TABLE IF EXISTS store_visits CASCADE;
DROP TABLE IF EXISTS raffle_tickets CASCADE;
DROP TABLE IF EXISTS prizes CASCADE;
DROP TABLE IF EXISTS gamification_points CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS withdrawal_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;

-- Habilitar a extensão pgcrypto para geração de UUIDs, caso não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. TIPOS ENUM (ESTRUTURA DE DADOS)
-- ==========================================
CREATE TYPE user_role AS ENUM ('user', 'store', 'admin');
CREATE TYPE lead_status AS ENUM ('interested', 'contacted', 'completed', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percent', 'value');

-- ==========================================
-- 2. TABELAS DO SISTEMA
-- ==========================================

-- 2.1 Perfis de Usuários (Estendendo Auth.Users do Supabase)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- 2.2 Lojas (Módulo Lojista)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    document_cnpj TEXT,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    subscription_status TEXT DEFAULT 'trial' NOT NULL CHECK (subscription_status IN ('trial', 'active', 'inactive')),
    subscription_ends_at TIMESTAMPTZ,
    rating NUMERIC(3,2) DEFAULT 5.00 NOT NULL CHECK (rating >= 0 AND rating <= 5.00),
    address JSONB DEFAULT '{}'::jsonb NOT NULL,
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_subscription ON stores(subscription_status);

-- 2.3 Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    original_price NUMERIC(10,2) NOT NULL CHECK (original_price >= 0),
    current_price NUMERIC(10,2) NOT NULL CHECK (current_price >= 0),
    images TEXT[] DEFAULT '{}'::text[] NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'rejected')),
    stock INTEGER DEFAULT 0 NOT NULL CHECK (stock >= 0),
    is_featured BOOLEAN DEFAULT false NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);

-- 2.4 Promoções (Agendamento de Campanhas pelos Lojistas/Admin)
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    promotional_price NUMERIC(10,2) NOT NULL CHECK (promotional_price >= 0),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    CHECK (end_date > start_date)
);

CREATE INDEX idx_promotions_product ON promotions(product_id);

-- 2.5 Cupons de Desconto (Exibidos na vitrine e validados no atendimento)
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL se criado pelo Admin da Plataforma
    code TEXT NOT NULL UNIQUE,
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    type discount_type NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 100 NOT NULL CHECK (max_uses >= 0),
    uses_count INTEGER DEFAULT 0 NOT NULL CHECK (uses_count <= max_uses),
    created_by TEXT DEFAULT 'store' NOT NULL CHECK (created_by IN ('admin', 'store')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- 2.6 Leads de Vendas (Intenção de Compra / Início de Negociação)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    negotiation_channel TEXT DEFAULT 'chat' NOT NULL CHECK (negotiation_channel IN ('chat', 'whatsapp')),
    status lead_status DEFAULT 'interested' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 2.7 Sistema de Gamificação (Pontos Castanha)
CREATE TABLE gamification_points (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0 NOT NULL CHECK (points_balance >= 0)
);

-- 2.8 Prêmios da Gamificação (Cadastrados pelo Admin)
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    draw_date TIMESTAMPTZ NOT NULL,
    is_drawn BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.9 Bilhetes de Sorteio gerados com Pontos Castanha
CREATE TABLE raffle_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    ticket_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tickets_user ON raffle_tickets(user_id);
CREATE INDEX idx_tickets_prize ON raffle_tickets(prize_id);

-- 2.10 Registro de Leituras de QR Codes (Visitas Físicas / Check-ins nas lojas)
-- Nota: visit_date com restrição UNIQUE garante a limitação de 1 check-in por usuário/loja por dia sem depender de funções mutáveis em índices.
CREATE TABLE store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    visit_date DATE DEFAULT CURRENT_DATE NOT NULL,
    points_awarded INTEGER DEFAULT 10 NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_daily_visit UNIQUE (user_id, store_id, visit_date)
);

CREATE INDEX idx_visits_user ON store_visits(user_id);
CREATE INDEX idx_visits_store ON store_visits(store_id);

-- ==========================================
-- 3. TRIGGERS E FUNÇÕES DE BANCO DE DADOS (AUTOMATIZAÇÕES)
-- ==========================================

-- 3.1 Criar Perfil de Usuário Automaticamente no Cadastro
-- SECURITY DEFINER garante permissões e SET search_path = public evita problemas de resolução de tipos customizados no esquema auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'user'::public.user_role
    );
    
    -- Iniciar a carteira de pontos do usuário
    INSERT INTO public.gamification_points (user_id, points_balance)
    VALUES (new.id, 0);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

-- 4.1 Perfis (profiles)
CREATE POLICY "Leitura pública de perfis" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seu próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4.2 Lojas (stores)
CREATE POLICY "Leitura pública de lojas" ON stores 
    FOR SELECT USING (true);

CREATE POLICY "Lojistas podem criar/editar suas próprias lojas" ON stores 
    FOR ALL USING (auth.uid() = owner_id);

-- 4.3 Produtos (products)
CREATE POLICY "Leitura pública de produtos publicados" ON products 
    FOR SELECT USING (status = 'published');

CREATE POLICY "Lojistas podem ver todos os seus produtos" ON products 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Lojistas podem criar/editar seus produtos" ON products 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
        )
    );

-- 4.4 Promoções (promotions)
CREATE POLICY "Leitura pública de promoções" ON promotions 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Lojistas podem editar suas promoções" ON promotions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products
            JOIN stores ON stores.id = products.store_id
            WHERE products.id = promotions.product_id AND stores.owner_id = auth.uid()
        )
    );

-- 4.5 Pedidos/Leads (orders)
CREATE POLICY "Consumidores visualizam seus próprios leads" ON orders 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Lojistas visualizam leads de sua loja" ON orders 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Consumidores criam leads" ON orders 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lojistas podem atualizar leads de sua loja" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
        )
    );

-- 4.6 Visitas/Check-ins (store_visits)
CREATE POLICY "Leitura de visitas próprias" ON store_visits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Lojistas veem visitas da sua loja" ON store_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_visits.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Clientes inserem visitas" ON store_visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);
