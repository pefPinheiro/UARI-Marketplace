'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLojista } from '../layout-client';
import { lojistaService } from '../../services/lojista';
import { supabase } from '../../lib/supabase';

interface PlanFeatures {
  logo_original?: boolean;
  banner_lojista?: boolean;
  notificacoes_app?: boolean;
  criacao_promocoes?: boolean;
  max_produtos?: number;
  suporte?: string;
  exposicao_vitrine?: string;
  criacao_sorteios?: boolean;
  prioridade_buscas?: string;
  estatisticas_venda?: string;
  selos_plataforma?: boolean;
  chat_cliente?: boolean;
  cursos_plataforma?: boolean;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_days: number;
  features: PlanFeatures;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'mock-1',
    title: 'Plano Bronze',
    description: 'Ideal para lojistas iniciantes com poucos produtos que querem começar a vender online.',
    price: 49.90,
    duration_days: 30,
    features: {
      logo_original: false,
      banner_lojista: false,
      notificacoes_app: false,
      criacao_promocoes: true,
      max_produtos: 10,
      suporte: 'E-mail',
      exposicao_vitrine: 'Standard',
      criacao_sorteios: false,
      prioridade_buscas: 'Baixa',
      estatisticas_venda: 'Básica',
      selos_plataforma: false,
      chat_cliente: false,
      cursos_plataforma: false
    }
  },
  {
    id: 'mock-2',
    title: 'Plano Prata',
    description: 'A escolha mais popular para comércios locais estabelecidos expandirem suas vendas.',
    price: 149.90,
    duration_days: 30,
    features: {
      logo_original: true,
      banner_lojista: true,
      notificacoes_app: true,
      criacao_promocoes: true,
      max_produtos: 50,
      suporte: 'WhatsApp Comercial',
      exposicao_vitrine: 'Melhorado',
      criacao_sorteios: false,
      prioridade_buscas: 'Média',
      estatisticas_venda: 'Detalhada',
      selos_plataforma: true,
      chat_cliente: true,
      cursos_plataforma: true
    }
  },
  {
    id: 'mock-3',
    title: 'Plano Ouro (VIP)',
    description: 'Para grandes lojas e marcas locais que buscam prioridade máxima, relatórios avançados e taxas reduzidas.',
    price: 399.90,
    duration_days: 30,
    features: {
      logo_original: true,
      banner_lojista: true,
      notificacoes_app: true,
      criacao_promocoes: true,
      max_produtos: 0,
      suporte: 'WhatsApp 24/7 / Gerente VIP',
      exposicao_vitrine: 'Premium',
      criacao_sorteios: true,
      prioridade_buscas: 'Máxima',
      estatisticas_venda: 'Avançada',
      selos_plataforma: true,
      chat_cliente: true,
      cursos_plataforma: true
    }
  }
];

export default function FinanceiroPage() {
  const { store } = useLojista();
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('');
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const getPlanBenefits = (plan: Plan) => {
    const list: string[] = [];
    
    if (plan.features.max_produtos !== undefined) {
      list.push(plan.features.max_produtos === 0 ? 'Produtos cadastrados: Ilimitado' : `Até ${plan.features.max_produtos} produtos expostos`);
    }
    if (plan.features.exposicao_vitrine) {
      list.push(`Exposição na Vitrine: ${plan.features.exposicao_vitrine}`);
    }
    if (plan.features.prioridade_buscas) {
      list.push(`Prioridade em buscas: ${plan.features.prioridade_buscas}`);
    }
    if (plan.features.suporte) {
      list.push(`Suporte: ${plan.features.suporte}`);
    }
    if (plan.features.selos_plataforma) {
      list.push('Selo UÁRI de Confiança');
    }
    if (plan.features.chat_cliente) {
      list.push('Chat em tempo real com clientes');
    }
    if (plan.features.cursos_plataforma) {
      list.push('Participação em cursos da plataforma');
    }
    if (plan.features.criacao_promocoes) {
      list.push('Criação de Promoções/Cupons');
    }
    if (plan.features.criacao_sorteios) {
      list.push('Ferramenta de Sorteios');
    }
    if (plan.features.notificacoes_app) {
      list.push('Disparo de Notificações no App');
    }
    
    return list;
  };

  const loadFinancialData = useCallback(async () => {
    if (!store?.id) return;
    setTimeout(() => setLoading(true), 0); // Asynchronous to avoid ESLint warning in useEffect
    try {
      // 1. Busca produtos reais cadastrados na loja para calcular o progresso
      const prods = await lojistaService.fetchStoreProducts(store.id);
      setProductsCount(prods?.length || 0);

      // 2. Carrega planos do banco
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      let activePlansList: Plan[] = [];
      if (plansData && plansData.length > 0) {
        activePlansList = plansData as Plan[];
      } else {
        // Tabela vazia: Semeia os planos diretamente no Supabase remoto!
        console.log('Tabela plans vazia no lojista. Semeando dados padrão...');
        const initialPlansToSeed = [
          {
            title: 'Plano Bronze',
            description: 'Ideal para lojistas iniciantes com poucos produtos que querem começar a vender online.',
            price: 49.90,
            duration_days: 30,
            features: {
              logo_original: false,
              banner_lojista: false,
              notificacoes_app: false,
              criacao_promocoes: true,
              max_produtos: 10,
              suporte: 'E-mail',
              exposicao_vitrine: 'Standard',
              criacao_sorteios: false,
              prioridade_buscas: 'Baixa',
              estatisticas_venda: 'Básica',
              selos_plataforma: false,
              chat_cliente: false,
              cursos_plataforma: false
            }
          },
          {
            title: 'Plano Prata',
            description: 'A escolha mais popular para comércios locais estabelecidos expandirem suas vendas.',
            price: 149.90,
            duration_days: 30,
            features: {
              logo_original: true,
              banner_lojista: true,
              notificacoes_app: true,
              criacao_promocoes: true,
              max_produtos: 50,
              suporte: 'WhatsApp Comercial',
              exposicao_vitrine: 'Melhorado',
              criacao_sorteios: false,
              prioridade_buscas: 'Média',
              estatisticas_venda: 'Detalhada',
              selos_plataforma: true,
              chat_cliente: true,
              cursos_plataforma: true
            }
          },
          {
            title: 'Plano Ouro (VIP)',
            description: 'Para grandes lojas e marcas locais que buscam prioridade máxima, relatórios avançados e taxas reduzidas.',
            price: 399.90,
            duration_days: 30,
            features: {
              logo_original: true,
              banner_lojista: true,
              notificacoes_app: true,
              criacao_promocoes: true,
              max_produtos: 0,
              suporte: 'WhatsApp 24/7 / Gerente VIP',
              exposicao_vitrine: 'Premium',
              criacao_sorteios: true,
              prioridade_buscas: 'Máxima',
              estatisticas_venda: 'Avançada',
              selos_plataforma: true,
              chat_cliente: true,
              cursos_plataforma: true
            }
          }
        ];

        const { data: seeded, error: seedError } = await supabase
          .from('plans')
          .insert(initialPlansToSeed)
          .select();

        if (seedError) {
          throw seedError;
        }

        if (seeded && seeded.length > 0) {
          activePlansList = seeded as Plan[];
        } else {
          activePlansList = DEFAULT_PLANS;
        }
      }
      setPlans(activePlansList);

      // 3. Sincroniza plano ativo com base no banco
      const { data: storeData } = await supabase
        .from('stores')
        .select('plan_id, subscription_status')
        .eq('id', store.id)
        .single();

      if (storeData && storeData.plan_id) {
        setCurrentPlanId(storeData.plan_id);
      } else {
        // Fallback para primeiro plano do mock/banco
        setCurrentPlanId(activePlansList[0]?.id || '');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do plano:', err);
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleChoosePlan = async (planId: string) => {
    if (!store?.id || updatingPlan) return;
    
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;
    
    if (confirm(`Deseja assinar o plano "${selectedPlan.title}" por ${formatCurrency(selectedPlan.price)}/mês?`)) {
      setUpdatingPlan(true);
      try {
        const durationDays = selectedPlan.duration_days || 30;
        const subscriptionEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        
        const { error } = await supabase
          .from('stores')
          .update({
            plan_id: planId,
            subscription_status: 'active',
            subscription_ends_at: subscriptionEndsAt
          })
          .eq('id', store.id);
          
        if (error) throw error;
        
        setCurrentPlanId(planId);
        alert(`Sucesso! Sua loja foi vinculada ao "${selectedPlan.title}".`);
        loadFinancialData();
      } catch (err) {
        console.error('Erro ao atualizar plano do lojista:', err);
        alert('Erro ao atualizar plano. Tente novamente.');
      } finally {
        setUpdatingPlan(false);
      }
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <span style={styles.skeletonText}>Carregando dados da assinatura...</span>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

  // Data de vencimento baseada na data de encerramento real no banco ou 30 dias a partir de hoje
  const expirationDate = store?.subscription_ends_at
    ? new Date(store.subscription_ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={styles.container}>
      
      {/* Top Title Section */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Plano e Assinatura</h1>
          <p style={styles.pageSubtitle}>Confira os detalhes e benefícios do seu plano no UÁRI Marketplace.</p>
        </div>
      </section>

      {/* Operacional Section: Gerenciamento de Planos e Limites */}
      <section style={styles.leftCard}>
        <div style={styles.cardHeaderRow}>
          <div>
            <h2 style={styles.cardTitle}>Status do seu Plano UÁRI</h2>
            <p style={styles.cardSubtitle}>
              Próximo Vencimento: <strong>{expirationDate}</strong>
            </p>
          </div>
          <div style={styles.planBadgeContainer}>
            <span style={styles.planBadgeActive}>{currentPlan ? currentPlan.title : 'Nenhum'}</span>
          </div>
        </div>

        {/* Barra de Progresso de Limite de Produtos */}
        {currentPlan && (
          <div style={styles.planUsageWrapper}>
            <div style={styles.planUsageText}>
              <span>
                Ocupação do Catálogo: <strong>{productsCount}</strong> de{' '}
                <strong>
                  {currentPlan.features?.max_produtos === 0 ? 'Ilimitado' : currentPlan.features?.max_produtos || 5}
                </strong>{' '}
                produtos cadastrados
              </span>
              {currentPlan.features?.max_produtos !== 0 && (
                <span>
                  {Math.round(
                    (productsCount / (currentPlan.features?.max_produtos || 5)) * 100
                  )}
                  %
                </span>
              )}
            </div>
            {currentPlan.features?.max_produtos !== 0 && (
              <div style={styles.planProgressBarBg}>
                <div
                  style={{
                    ...styles.planProgressBarFill,
                    width: `${Math.min(
                      (productsCount / (currentPlan.features?.max_produtos || 5)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Escolha e Tabela de Planos */}
        <div style={styles.plansGrid}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const benefits = getPlanBenefits(plan);
            return (
              <div 
                key={plan.id} 
                style={{
                  ...styles.planCard,
                  borderColor: isCurrent ? 'var(--primary)' : 'var(--outline-variant)',
                  borderWidth: isCurrent ? '2px' : '1px'
                }}
              >
                <div style={styles.planCardHeader}>
                  <span style={styles.planCardName}>{plan.title}</span>
                  <span style={styles.planCardPrice}>
                    {plan.price === 0 ? 'Grátis' : `${formatCurrency(plan.price)}/mês`}
                  </span>
                </div>
                <p style={styles.planCardLimit}>
                  {plan.features?.max_produtos === 0 ? 'Produtos Ilimitados' : `Até ${plan.features?.max_produtos || 5} produtos`}
                </p>
                <ul style={styles.planCardBenefits}>
                  {benefits.map((b, i) => (
                    <li key={i} style={styles.benefitItem}>✓ {b}</li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleChoosePlan(plan.id)}
                  disabled={isCurrent || updatingPlan}
                  style={{
                    ...styles.planCardBtn,
                    backgroundColor: isCurrent ? 'var(--primary)' : 'transparent',
                    color: isCurrent ? '#ffffff' : 'var(--primary)',
                    border: isCurrent ? 'none' : '1px solid var(--primary)',
                    opacity: updatingPlan ? 0.7 : 1,
                    cursor: isCurrent ? 'default' : 'pointer'
                  }}
                >
                  {isCurrent ? 'Plano Ativo' : 'Mudar de Plano'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Inferior */}
      <footer style={styles.bottomFooter}>
        <div style={styles.verifiedRow}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>verified</span>
          <span style={styles.verifiedText}>Vendedor Verificado pela UÁRI em Tefé, Amazonas.</span>
        </div>
        <span style={styles.footerCopyright}>Quebra essa castanha — © 2024 UÁRI Shop Fácil</span>
      </footer>

    </div>
  );
}

// Estilos premium inline baseados no UÁRI Design System
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '350px',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(110, 0, 193, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  skeletonText: {
    color: 'var(--on-surface-variant)',
    fontSize: '14px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--primary)',
    fontFamily: 'Plus Jakarta Sans',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: 'var(--on-surface-variant)',
    marginTop: '4px',
  },
  leftCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    padding: '24px',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    marginTop: '4px',
  },
  planBadgeContainer: {
    alignSelf: 'flex-start',
  },
  planBadgeActive: {
    padding: '6px 16px',
    backgroundColor: 'rgba(110, 0, 193, 0.1)',
    color: 'var(--primary)',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: '700',
  },
  planUsageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px',
    marginBottom: '24px',
  },
  planUsageText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  planProgressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--surface-container)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  planProgressBarFill: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '4px',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  planCard: {
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid var(--outline-variant)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  planCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  planCardName: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    maxWidth: '60%',
  },
  planCardPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  planCardLimit: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    marginBottom: '16px',
  },
  planCardBenefits: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  benefitItem: {
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
    lineHeight: '16px',
  },
  planCardBtn: {
    marginTop: 'auto',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  bottomFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid var(--surface-container-highest)',
  },
  verifiedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  verifiedText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
  },
  footerCopyright: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--on-surface-variant)',
  }
};
