-- ========================================================
-- TABELA DE PLANOS DE LOJISTAS (FINANCEIRO)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bypassa RLS em desenvolvimento para permitir o gerenciamento do Admin Web
ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;

-- Insere alguns planos iniciais padrão (se não existirem)
INSERT INTO public.plans (title, description, price, duration_days, features)
VALUES 
(
  'Plano Bronze', 
  'Ideal para lojistas iniciantes com poucos produtos que querem começar a vender online.', 
  49.90, 
  30, 
  '{
    "logo_original": false,
    "banner_lojista": false,
    "notificacoes_app": false,
    "criacao_promocoes": true,
    "max_produtos": 10,
    "suporte": "E-mail",
    "exposicao_vitrine": "Standard",
    "criacao_sorteios": false,
    "prioridade_buscas": "Baixa",
    "estatisticas_venda": "Básica",
    "selos_plataforma": false,
    "chat_cliente": false,
    "cursos_plataforma": false
  }'::jsonb
),
(
  'Plano Prata', 
  'A escolha mais popular para comércios locais estabelecidos expandirem suas vendas.', 
  149.90, 
  30, 
  '{
    "logo_original": true,
    "banner_lojista": true,
    "notificacoes_app": true,
    "criacao_promocoes": true,
    "max_produtos": 50,
    "suporte": "WhatsApp (Horário Comercial)",
    "exposicao_vitrine": "Melhorado",
    "criacao_sorteios": false,
    "prioridade_buscas": "Média",
    "estatisticas_venda": "Detalhada",
    "selos_plataforma": true,
    "chat_cliente": true,
    "cursos_plataforma": true
  }'::jsonb
),
(
  'Plano Ouro (VIP)', 
  'Para grandes lojas e marcas locais que buscam prioridade máxima, relatórios avançados e taxas reduzidas.', 
  399.90, 
  30, 
  '{
    "logo_original": true,
    "banner_lojista": true,
    "notificacoes_app": true,
    "criacao_promocoes": true,
    "max_produtos": 9999,
    "suporte": "Gerente de Contas / WhatsApp 24/7",
    "exposicao_vitrine": "Premium",
    "criacao_sorteios": true,
    "prioridade_buscas": "Máxima",
    "estatisticas_venda": "Avançada",
    "selos_plataforma": true,
    "chat_cliente": true,
    "cursos_plataforma": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Notifica o PostgREST para limpar o cache do schema
NOTIFY pgrst, 'reload schema';
