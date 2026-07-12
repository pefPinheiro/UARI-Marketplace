-- ========================================================
-- SISTEMA DE CURADORIA E PERMISSÕES MASTER (ADMIN RLS)
-- ========================================================

-- 1. Criação da função auxiliar para checar se o usuário é Admin (segura contra recursão RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- SECURITY DEFINER roda com as permissões de quem criou a função (postgres/superuser),
    -- ignorando o RLS para a consulta à tabela public.profiles e evitando loops infinitos de recursão.
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Limpeza de políticas existentes para evitar erros de duplicidade
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as lojas" ON public.stores;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os produtos" ON public.products;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os itens de pedidos" ON public.order_items;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as carteiras" ON public.wallets;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os saques" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as transações" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as promoções" ON public.promotions;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os cupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins podem gerenciar pontos de gamificação" ON public.gamification_points;
DROP POLICY IF EXISTS "Admins podem gerenciar prêmios" ON public.prizes;
DROP POLICY IF EXISTS "Admins podem gerenciar bilhetes de sorteio" ON public.raffle_tickets;
DROP POLICY IF EXISTS "Admins podem gerenciar visitas" ON public.store_visits;

-- 3. Aplicação de Políticas Master para Admin em todas as tabelas

-- 3.1 Profiles
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins podem atualizar todos os perfis" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.2 Stores
CREATE POLICY "Admins podem gerenciar todas as lojas" ON public.stores
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.3 Products
CREATE POLICY "Admins podem gerenciar todos os produtos" ON public.products
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.4 Orders
CREATE POLICY "Admins podem gerenciar todos os pedidos" ON public.orders
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.5 Order Items
CREATE POLICY "Admins podem gerenciar todos os itens de pedidos" ON public.order_items
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.6 Wallets
CREATE POLICY "Admins podem gerenciar todas as carteiras" ON public.wallets
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.7 Withdrawals (Saques)
CREATE POLICY "Admins podem gerenciar todos os saques" ON public.withdrawals
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.8 Wallet Transactions (Histórico de transações)
CREATE POLICY "Admins podem gerenciar todas as transações" ON public.wallet_transactions
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.9 Promotions
CREATE POLICY "Admins podem gerenciar todas as promoções" ON public.promotions
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.10 Coupons
CREATE POLICY "Admins podem gerenciar todos os cupons" ON public.coupons
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.11 Gamification Points
CREATE POLICY "Admins podem gerenciar pontos de gamificação" ON public.gamification_points
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.12 Prizes (Prêmios)
CREATE POLICY "Admins podem gerenciar prêmios" ON public.prizes
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.13 Raffle Tickets (Bilhetes de sorteio)
CREATE POLICY "Admins podem gerenciar bilhetes de sorteio" ON public.raffle_tickets
    FOR ALL TO authenticated USING (public.is_admin());

-- 3.14 Store Visits (Visitas diárias)
CREATE POLICY "Admins podem gerenciar visitas" ON public.store_visits
    FOR ALL TO authenticated USING (public.is_admin());

-- ========================================================
-- RECARGA DE SCHEMA CACHE
-- ========================================================
NOTIFY pgrst, 'reload schema';
