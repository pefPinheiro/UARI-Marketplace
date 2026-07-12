'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';



// Interfaces para os Planos de Lojistas
interface PlanFeatures {
  logo_original: boolean;
  banner_lojista: boolean;
  notificacoes_app: boolean;
  criacao_promocoes: boolean;
  max_produtos: number; // 0 para ilimitado
  suporte: 'E-mail' | 'WhatsApp Comercial' | 'WhatsApp 24/7 / Gerente VIP';
  exposicao_vitrine: 'Standard' | 'Melhorado' | 'Premium';
  criacao_sorteios: boolean;
  prioridade_buscas: 'Baixa' | 'Média' | 'Máxima';
  estatisticas_venda: 'Básica' | 'Detalhada' | 'Avançada';
  selos_plataforma: boolean;
  chat_cliente: boolean;
  cursos_plataforma: boolean;
  faz_entrega?: boolean;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_days: number;
  features: PlanFeatures;
  created_at?: string;
}

interface LojistaAssinatura {
  id: string;
  name: string;
  ownerName: string;
  planId: string | null;
  subscriptionStatus: 'trial' | 'active' | 'inactive';
  subscriptionEndsAt: string | null;
}

export default function FinanceiroPage() {
  // Controle de Tabs ('planos' ou 'assinaturas')
  const [activeTab, setActiveTab] = useState<'planos' | 'assinaturas'>('planos');
  const [stores, setStores] = useState<LojistaAssinatura[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [now] = useState(() => Date.now());



  // ==========================================
  // ESTADOS E FUNÇÕES DE PLANOS (NOVO MÓDULO)
  // ==========================================
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Formulário do Plano Ativo
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('30');

  // Funcionalidades toggles no formulário
  const [featLogoOriginal, setFeatLogoOriginal] = useState(false);
  const [featBannerLojista, setFeatBannerLojista] = useState(false);
  const [featNotificacoesApp, setFeatNotificacoesApp] = useState(false);
  const [featCriacaoPromocoes, setFeatCriacaoPromocoes] = useState(false);
  const [featMaxProdutos, setFeatMaxProdutos] = useState('50');
  const [featSuporte, setFeatSuporte] = useState<'E-mail' | 'WhatsApp Comercial' | 'WhatsApp 24/7 / Gerente VIP'>('E-mail');
  const [featExposicaoVitrine, setFeatExposicaoVitrine] = useState<'Standard' | 'Melhorado' | 'Premium'>('Standard');
  const [featCriacaoSorteios, setFeatCriacaoSorteios] = useState(false);
  const [featPrioridadeBuscas, setFeatPrioridadeBuscas] = useState<'Baixa' | 'Média' | 'Máxima'>('Baixa');
  const [featEstatisticasVenda, setFeatEstatisticasVenda] = useState<'Básica' | 'Detalhada' | 'Avançada'>('Básica');
  const [featSelosPlataforma, setFeatSelosPlataforma] = useState(false);
  const [featChatCliente, setFeatChatCliente] = useState(false);
  const [featCursosPlataforma, setFeatCursosPlataforma] = useState(false);
  const [featFazEntrega, setFeatFazEntrega] = useState(false);

  // Modal de Exclusão de Plano
  const [deletePlanModal, setDeletePlanModal] = useState<{ isOpen: boolean; planId: string; planTitle: string } | null>(null);

  // Notificações Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carrega planos da tabela Supabase (com fallback em LocalStorage/Mock)
  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPlans(data as Plan[]);
        // Auto-seleciona primeiro
        if (data.length > 0 && !selectedPlanId) {
          loadPlanIntoForm(data[0] as Plan);
        }
      } else {
        // Fallback: Se a tabela existir mas estiver vazia, vamos semeá-la no banco!
        console.log('Tabela public.plans está vazia. Semeando dados padrão...');
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
          setPlans(seeded as Plan[]);
          if (!selectedPlanId) {
            loadPlanIntoForm(seeded[0] as Plan);
          }
        } else {
          loadMockPlansFallback();
        }
      }
    } catch (err) {
      console.warn('Tabela public.plans não encontrada ou erro na conexão. Carregando dados locais de fallback.', err);
      loadMockPlansFallback();
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadMockPlansFallback = () => {
    const saved = localStorage.getItem('uari_mock_plans');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPlans(parsed);
      if (parsed.length > 0 && !selectedPlanId) {
        loadPlanIntoForm(parsed[0]);
      }
    } else {
      const initialMock: Plan[] = [
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
      setPlans(initialMock);
      localStorage.setItem('uari_mock_plans', JSON.stringify(initialMock));
      if (!selectedPlanId) {
        loadPlanIntoForm(initialMock[0]);
      }
    }
  };

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          subscription_status,
          subscription_ends_at,
          plan_id,
          profiles (
            full_name
          )
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: LojistaAssinatura[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          ownerName: item.profiles?.full_name || 'Proprietário local',
          planId: item.plan_id,
          subscriptionStatus: item.subscription_status || 'trial',
          subscriptionEndsAt: item.subscription_ends_at,
        }));
        setStores(mapped);
      } else {
        loadMockStoresFallback();
      }
    } catch (err) {
      console.warn('Erro ao carregar lojas do Supabase. Carregando dados locais de fallback.', err);
      loadMockStoresFallback();
    } finally {
      setLoadingStores(false);
    }
  };

  const loadMockStoresFallback = () => {
    const saved = localStorage.getItem('uari_mock_stores');
    if (saved) {
      setStores(JSON.parse(saved));
    } else {
      const initialMock: LojistaAssinatura[] = [
        {
          id: 'store-1',
          name: 'Moda Regional Tefé',
          ownerName: 'Elves Pinheiro',
          planId: 'mock-2',
          subscriptionStatus: 'active',
          subscriptionEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'store-2',
          name: 'Empório do Norte',
          ownerName: 'Maria Antônia',
          planId: 'mock-1',
          subscriptionStatus: 'active',
          subscriptionEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'store-3',
          name: 'Artesanato Tefé',
          ownerName: 'João de Souza',
          planId: 'mock-3',
          subscriptionStatus: 'active',
          subscriptionEndsAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'store-4',
          name: 'Loja Amazônia Viva',
          ownerName: 'Ana Silva',
          planId: null,
          subscriptionStatus: 'trial',
          subscriptionEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
      setStores(initialMock);
      localStorage.setItem('uari_mock_stores', JSON.stringify(initialMock));
    }
  };

  const handleUpdateStorePlan = async (storeId: string, newPlanId: string | null) => {
    try {
      const plan = plans.find(p => p.id === newPlanId);
      const durationDays = plan ? plan.duration_days : 30;
      const subscriptionStatus = newPlanId ? 'active' : 'inactive';
      const subscriptionEndsAt = newPlanId 
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (!storeId.startsWith('store-')) {
        const { error } = await supabase
          .from('stores')
          .update({
            plan_id: newPlanId || null,
            subscription_status: subscriptionStatus,
            subscription_ends_at: subscriptionEndsAt
          })
          .eq('id', storeId);

        if (error) throw error;
        showToast('🎉 Plano do lojista atualizado com sucesso no Supabase!');
      } else {
        throw new Error('Operando em modo local');
      }
      
      await fetchStores();
    } catch (err) {
      console.log('Operando atualização local de fallback.');
      const saved = localStorage.getItem('uari_mock_stores');
      let currentMockList: LojistaAssinatura[] = saved ? JSON.parse(saved) : [];
      
      const plan = plans.find(p => p.id === newPlanId);
      const durationDays = plan ? plan.duration_days : 30;
      const subscriptionStatus = newPlanId ? 'active' : 'inactive';
      const subscriptionEndsAt = newPlanId 
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      currentMockList = currentMockList.map(st => {
        if (st.id === storeId) {
          return {
            ...st,
            planId: newPlanId,
            subscriptionStatus: subscriptionStatus as any,
            subscriptionEndsAt: subscriptionEndsAt
          };
        }
        return st;
      });

      setStores(currentMockList);
      localStorage.setItem('uari_mock_stores', JSON.stringify(currentMockList));
      showToast('🎉 Plano do lojista atualizado com sucesso (Modo Local)!');
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchStores();
  }, []);

  // Preenche formulário com os dados do plano clicado
  const loadPlanIntoForm = (p: Plan) => {
    setSelectedPlanId(p.id);
    setPlanTitle(p.title);
    setPlanDescription(p.description || '');
    setPlanPrice(p.price.toFixed(2));
    setPlanDuration(String(p.duration_days));

    // Funcionalidades
    setFeatLogoOriginal(p.features.logo_original);
    setFeatBannerLojista(p.features.banner_lojista);
    setFeatNotificacoesApp(p.features.notificacoes_app);
    setFeatCriacaoPromocoes(p.features.criacao_promocoes);
    setFeatMaxProdutos(String(p.features.max_produtos));
    setFeatSuporte(p.features.suporte || 'E-mail');
    setFeatExposicaoVitrine(p.features.exposicao_vitrine || 'Standard');
    setFeatCriacaoSorteios(p.features.criacao_sorteios || false);
    setFeatPrioridadeBuscas(p.features.prioridade_buscas || 'Baixa');
    setFeatEstatisticasVenda(p.features.estatisticas_venda || 'Básica');
    setFeatSelosPlataforma(p.features.selos_plataforma || false);
    setFeatChatCliente(p.features.chat_cliente || false);
    setFeatCursosPlataforma(p.features.cursos_plataforma || false);
    setFeatFazEntrega(p.features.faz_entrega || false);
  };

  // Inicializa formulário para criação de novo plano
  const handleInitNewPlan = () => {
    setSelectedPlanId(null);
    setPlanTitle('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanDuration('30');

    setFeatLogoOriginal(false);
    setFeatBannerLojista(false);
    setFeatNotificacoesApp(false);
    setFeatCriacaoPromocoes(true);
    setFeatMaxProdutos('50');
    setFeatSuporte('E-mail');
    setFeatExposicaoVitrine('Standard');
    setFeatCriacaoSorteios(false);
    setFeatPrioridadeBuscas('Baixa');
    setFeatEstatisticasVenda('Básica');
    setFeatSelosPlataforma(false);
    setFeatChatCliente(false);
    setFeatCursosPlataforma(false);
    setFeatFazEntrega(false);
  };

  // Salvar Plano no banco de dados / LocalStorage
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim() || !planPrice) return;

    setSavingPlan(true);
    
    const parsedPrice = parseFloat(planPrice.replace(',', '.')) || 0;
    const parsedDuration = parseInt(planDuration) || 30;
    const parsedMaxProducts = parseInt(featMaxProdutos) || 0;

    const planData: Partial<Plan> = {
      title: planTitle.trim(),
      description: planDescription.trim(),
      price: parsedPrice,
      duration_days: parsedDuration,
      features: {
        logo_original: featLogoOriginal,
        banner_lojista: featBannerLojista,
        notificacoes_app: featNotificacoesApp,
        criacao_promocoes: featCriacaoPromocoes,
        max_produtos: parsedMaxProducts,
        suporte: featSuporte,
        exposicao_vitrine: featExposicaoVitrine,
        criacao_sorteios: featCriacaoSorteios,
        prioridade_buscas: featPrioridadeBuscas,
        estatisticas_venda: featEstatisticasVenda,
        selos_plataforma: featSelosPlataforma,
        chat_cliente: featChatCliente,
        cursos_plataforma: featCursosPlataforma,
        faz_entrega: featFazEntrega
      }
    };

    try {
      let savedPlan: Plan;

      if (selectedPlanId && !selectedPlanId.startsWith('mock-')) {
        // 1. Atualizar no Supabase
        const { data, error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', selectedPlanId)
          .select();

        if (error) throw error;
        savedPlan = data[0] as Plan;
        showToast('🎉 Plano atualizado com sucesso no Supabase!');
      } else {
        // 2. Criar no Supabase (se selectedPlanId for vazio ou se for um mock- id)
        const { data, error } = await supabase
          .from('plans')
          .insert(planData)
          .select();

        if (error) throw error;
        savedPlan = data[0] as Plan;
        showToast('🎉 Plano registrado com sucesso no Supabase!');
      }

      await fetchPlans();
      loadPlanIntoForm(savedPlan);
    } catch (err) {
      // Bypassa para salvar localmente em caso de erro de conexão/tabela inexistente
      console.log('Operando salvamento local de fallback.');
      
      const saved = localStorage.getItem('uari_mock_plans');
      let currentMockList: Plan[] = saved ? JSON.parse(saved) : [];

      if (selectedPlanId) {
        // Editando mock existente
        currentMockList = currentMockList.map(p => {
          if (p.id === selectedPlanId) {
            return {
              ...p,
              title: planData.title!,
              description: planData.description!,
              price: planData.price!,
              duration_days: planData.duration_days!,
              features: planData.features!
            };
          }
          return p;
        });
        showToast('🎉 Plano atualizado com sucesso (Modo Local)!');
      } else {
        // Inserindo novo mock
        const newMockPlan: Plan = {
          id: `mock-${Date.now()}`,
          title: planData.title!,
          description: planData.description!,
          price: planData.price!,
          duration_days: planData.duration_days!,
          features: planData.features!
        };
        currentMockList.push(newMockPlan);
        setSelectedPlanId(newMockPlan.id);
        showToast('🎉 Novo plano registrado com sucesso (Modo Local)!');
      }

      setPlans(currentMockList);
      localStorage.setItem('uari_mock_plans', JSON.stringify(currentMockList));
      const newlySaved = currentMockList.find(p => p.id === selectedPlanId) || currentMockList[currentMockList.length - 1];
      loadPlanIntoForm(newlySaved);
    } finally {
      setSavingPlan(false);
    }
  };

  // Confirmação de exclusão do plano
  const handleDeletePlanConfirm = async () => {
    if (!deletePlanModal) return;
    const { planId, planTitle } = deletePlanModal;

    try {
      if (!planId.startsWith('mock-')) {
        // Exclusão no Supabase
        const { error } = await supabase
          .from('plans')
          .delete()
          .eq('id', planId);

        if (error) throw error;
        showToast(`Plano "${planTitle}" excluído do Supabase!`);
      } else {
        // Exclusão no LocalStorage
        const saved = localStorage.getItem('uari_mock_plans');
        if (saved) {
          const parsed: Plan[] = JSON.parse(saved);
          const filtered = parsed.filter(p => p.id !== planId);
          localStorage.setItem('uari_mock_plans', JSON.stringify(filtered));
          setPlans(filtered);
          showToast(`Plano "${planTitle}" excluído com sucesso!`);
        }
      }

      // Reinicia seleção e carrega lista
      setSelectedPlanId(null);
      await fetchPlans();
    } catch (err) {
      console.error('Erro ao deletar plano:', err);
      showToast('Erro ao excluir plano.', 'error');
    } finally {
      setDeletePlanModal(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };



  return (
    <div style={styles.container}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'success' ? '#2e7d32' : 'var(--error)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Central Financeira Master</h1>
          <p style={styles.pageSubtitle}>
            Configure os planos de lojistas com limite de recursos e gerencie as assinaturas ativas.
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('planos')}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === 'planos' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'planos' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: activeTab === 'planos' ? '800' : '600'
          }}
        >
          <span className="material-symbols-outlined">loyalty</span>
          <span>Gestão de Planos do Lojista</span>
        </button>

        <button
          onClick={() => setActiveTab('assinaturas')}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === 'assinaturas' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'assinaturas' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: activeTab === 'assinaturas' ? '800' : '600'
          }}
        >
          <span className="material-symbols-outlined">storefront</span>
          <span>Assinaturas dos Lojistas</span>
        </button>
      </div>

      {/* CONTEÚDO TABA 1: GESTÃO DE PLANOS (NOVO) */}
      {activeTab === 'planos' && (
        <div style={styles.mainWorkspaceGrid}>
          
          {/* Lado Esquerdo: Lista de Planos Disponíveis */}
          <div style={styles.leftQueueColumn}>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={styles.cardSectionTitle}>Planos Cadastrados</h2>
                <button
                  type="button"
                  onClick={handleInitNewPlan}
                  style={styles.addPlanBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                  <span>Novo Plano</span>
                </button>
              </div>

              {loadingPlans ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--outline)' }}>
                  Carregando planos de lojistas...
                </div>
              ) : plans.length === 0 ? (
                <div style={styles.emptyPlansState}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--outline)' }}>card_membership</span>
                  <span style={{ fontWeight: '750', fontSize: '13px' }}>Nenhum plano cadastrado</span>
                  <span style={{ fontSize: '11px', color: 'var(--outline)', textAlign: 'center' }}>Adicione planos de lojistas clicando no botão acima.</span>
                </div>
              ) : (
                <div style={styles.queueList}>
                  {plans.map(p => {
                    const isSelected = p.id === selectedPlanId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => loadPlanIntoForm(p)}
                        style={{
                          ...styles.queueItemCard,
                          borderColor: isSelected ? 'var(--primary)' : 'var(--outline-variant)',
                          backgroundColor: isSelected ? 'rgba(110, 0, 193, 0.03)' : '#ffffff',
                          boxShadow: isSelected ? '0px 4px 12px rgba(110,0,193,0.06)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ ...styles.queueProductTitle, fontSize: '14px', marginBottom: '4px' }}>{p.title}</h3>
                            <p style={{ fontSize: '11px', color: 'var(--outline)', margin: '0 0 8px 0', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.description}
                            </p>
                          </div>
                          <span style={styles.priceTag}>
                            R$ {p.price.toFixed(2)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--surface-container-highest)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                            <span>Expiração: {p.duration_days} dias</span>
                          </span>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletePlanModal({ isOpen: true, planId: p.id, planTitle: p.title });
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                              }}
                              title="Excluir Plano definitivamente"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Editor e Configuração de Recursos do Plano */}
          <div style={styles.rightEditorColumn}>
            <form onSubmit={handleSavePlan} style={styles.card}>
              <div style={styles.editorHeaderRow}>
                <div>
                  <span style={styles.editorPreTitle}>EDITOR E CONFIGURAÇÕES</span>
                  <h2 style={styles.editorMainTitle}>
                    {selectedPlanId ? 'Modificar Plano Lojista' : 'Criar Novo Plano Lojista'}
                  </h2>
                </div>
                {!selectedPlanId && (
                  <span style={{
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    color: '#2e7d32',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}>
                    NOVO PLANO
                  </span>
                )}
              </div>

              {/* Informações Básicas do Plano */}
              <div style={styles.editorSection}>
                <h3 style={styles.editorSectionTitle}>1. Informações Básicas</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Nome do Plano</label>
                  <input 
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="Ex: Plano Prata Premium"
                    style={styles.fieldInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Descrição Comercial</label>
                  <textarea 
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    placeholder="Ex: Plano ideal para comércios locais estabelecidos..."
                    style={styles.fieldTextarea}
                    rows={2}
                  />
                </div>

                <div style={styles.rowFormFields}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>Valor do Plano (R$)</label>
                    <input 
                      type="text"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      placeholder="99.90"
                      style={styles.fieldInput}
                      required
                    />
                  </div>

                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.fieldLabel}>Tempo de Validade (Dias)</label>
                    <select
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                      style={styles.fieldSelect}
                    >
                      <option value="30">30 dias (Mensal)</option>
                      <option value="90">90 dias (Trimestral)</option>
                      <option value="180">180 dias (Semestral)</option>
                      <option value="365">365 dias (Anual)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Configuração de Funcionalidades do Lojista */}
              <div style={styles.editorSection}>
                <h3 style={styles.editorSectionTitle}>2. Recursos da Loja (Funcionalidades)</h3>
                <p style={styles.imageSectionDesc}>Configure quais ferramentas e limitações os lojistas assinantes deste plano terão.</p>

                {/* Subgrupo: Identidade Visual da Loja */}
                <div style={styles.featuresSubGroup}>
                  <span style={styles.featuresSubGroupTitle}>Identidade Visual</span>
                  <div style={styles.checkboxGrid}>
                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-logo"
                        checked={featLogoOriginal}
                        onChange={(e) => setFeatLogoOriginal(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-logo" style={styles.checkboxLabel}>
                        <strong>Logo Original da Loja:</strong> Permite upload da imagem de logo personalizada. Se desmarcado, exibe logo genérico padrão.
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-banner"
                        checked={featBannerLojista}
                        onChange={(e) => setFeatBannerLojista(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-banner" style={styles.checkboxLabel}>
                        <strong>Banner da Loja:</strong> Permite que o lojista adicione uma imagem de capa personalizada em seu perfil de loja.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Subgrupo: Engajamento & Comunicação */}
                <div style={styles.featuresSubGroup}>
                  <span style={styles.featuresSubGroupTitle}>Engajamento & Comunicação</span>
                  <div style={styles.checkboxGrid}>
                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-notif"
                        checked={featNotificacoesApp}
                        onChange={(e) => setFeatNotificacoesApp(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-notif" style={styles.checkboxLabel}>
                        <strong>Notificações no App:</strong> Permite que o lojista faça disparo de mensagens promocionais em tempo real para os clientes.
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-chat"
                        checked={featChatCliente}
                        onChange={(e) => setFeatChatCliente(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-chat" style={styles.checkboxLabel}>
                        <strong>Chat com o Cliente:</strong> Ativa o bate-papo em tempo real entre o lojista e o comprador diretamente pelo app.
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-promos"
                        checked={featCriacaoPromocoes}
                        onChange={(e) => setFeatCriacaoPromocoes(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-promos" style={styles.checkboxLabel}>
                        <strong>Criação de Promoções/Cupons:</strong> Permite configurar cupons de descontos especiais e campanhas promocionais ativas.
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-sorteios"
                        checked={featCriacaoSorteios}
                        onChange={(e) => setFeatCriacaoSorteios(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-sorteios" style={styles.checkboxLabel}>
                        <strong>Criação de Sorteios:</strong> Libera a ferramenta de geração e sorteio de cupons/brindes digitais para clientes.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Subgrupo: Limites e Visibilidade na Vitrine */}
                <div style={styles.featuresSubGroup}>
                  <span style={styles.featuresSubGroupTitle}>Limites & Visibilidade</span>
                  <div style={styles.featureSelectGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.fieldLabel}>Limite de Produtos Cadastrados</label>
                      <input 
                        type="number"
                        value={featMaxProdutos}
                        onChange={(e) => setFeatMaxProdutos(e.target.value)}
                        placeholder="Ex: 50"
                        style={styles.fieldInput}
                      />
                      <span style={styles.fieldHelp}>Digite &quot;0&quot; para ilimitado.</span>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.fieldLabel}>Exposição na Vitrine Principal</label>
                      <select
                        value={featExposicaoVitrine}
                        onChange={(e) => setFeatExposicaoVitrine(e.target.value as any)}
                        style={styles.fieldSelect}
                      >
                        <option value="Standard">Standard (Comum)</option>
                        <option value="Melhorado">Melhorado (Carrossel intermediário)</option>
                        <option value="Premium">Premium (Banner principal de topo)</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.fieldLabel}>Prioridade em Buscas e Filtros</label>
                      <select
                        value={featPrioridadeBuscas}
                        onChange={(e) => setFeatPrioridadeBuscas(e.target.value as any)}
                        style={styles.fieldSelect}
                      >
                        <option value="Baixa">Baixa (Ordem padrão)</option>
                        <option value="Média">Média (Impulsionamento padrão)</option>
                        <option value="Máxima">Máxima (Primeira página das pesquisas)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subgrupo: Suporte, Selos e Vantagens Extras */}
                <div style={styles.featuresSubGroup}>
                  <span style={styles.featuresSubGroupTitle}>Suporte & Benefícios Exclusivos</span>
                  
                  <div style={styles.featureSelectGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.fieldLabel}>Nível de Suporte Técnico</label>
                      <select
                        value={featSuporte}
                        onChange={(e) => setFeatSuporte(e.target.value as any)}
                        style={styles.fieldSelect}
                      >
                        <option value="E-mail">E-mail (Básico)</option>
                        <option value="WhatsApp Comercial">WhatsApp Comercial (Horário Comercial)</option>
                        <option value="WhatsApp 24/7 / Gerente VIP">WhatsApp 24/7 / Gerente VIP (Prioritário)</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.fieldLabel}>Tipo de Estatísticas & Análise</label>
                      <select
                        value={featEstatisticasVenda}
                        onChange={(e) => setFeatEstatisticasVenda(e.target.value as any)}
                        style={styles.fieldSelect}
                      >
                        <option value="Básica">Básica (Total de Vendas)</option>
                        <option value="Detalhada">Detalhada (Gráficos e Produtos populares)</option>
                        <option value="Avançada">Avançada (Taxa de conversão, demografia de clientes)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ ...styles.checkboxGrid, marginTop: '12px' }}>
                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-selos"
                        checked={featSelosPlataforma}
                        onChange={(e) => setFeatSelosPlataforma(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-selos" style={styles.checkboxLabel}>
                        <strong>Selos UÁRI de Confiança:</strong> Exibe selos especiais no perfil da loja do lojista (ex: &quot;Vendedor Recomendado&quot;).
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-entrega"
                        checked={featFazEntrega}
                        onChange={(e) => setFeatFazEntrega(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-entrega" style={styles.checkboxLabel}>
                        <strong>Serviço de Entrega:</strong> O lojista que assinar este plano ganha a possibilidade de realizar entregas integradas/logística própria.
                      </label>
                    </div>

                    <div style={styles.checkboxRow}>
                      <input 
                        type="checkbox" 
                        id="feat-cursos"
                        checked={featCursosPlataforma}
                        onChange={(e) => setFeatCursosPlataforma(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <label htmlFor="feat-cursos" style={styles.checkboxLabel}>
                        <strong>Participação de Cursos:</strong> Libera a participação nos cursos de capacitação e treinamentos de vendas oferecidos pela plataforma.
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* Botões de Ação do Editor de Planos */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={savingPlan}
                  style={styles.savePlanSubmitBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  <span>{savingPlan ? 'Salvando...' : 'Salvar Configurações do Plano'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTEÚDO TABA 3: ASSINATURAS DOS LOJISTAS */}
      {activeTab === 'assinaturas' && (
        <>
          {/* Bento Grid KPIs */}
          <section style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Lojistas Assinantes Ativos</span>
              <div style={{ ...styles.metricValue, color: 'var(--primary)' }}>
                {stores.filter(st => st.planId && st.subscriptionStatus === 'active').length} / {stores.length}
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Previsão de Ganho no Mês</span>
              <div style={{ ...styles.metricValue, color: 'var(--tertiary)' }}>
                {formatCurrency(
                  stores.filter(st => st.planId && st.subscriptionStatus === 'active').reduce((sum, st) => {
                    const plan = plans.find(p => p.id === st.planId);
                    return sum + (plan ? plan.price : 0);
                  }, 0)
                )}
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Planos Cadastrados</span>
              <div style={{ ...styles.metricValue, color: 'var(--secondary)' }}>
                {plans.length}
              </div>
            </div>
          </section>

          {/* Lista de Assinaturas */}
          <section style={styles.card}>
            <h3 style={styles.cardSectionTitle}>Assinaturas e Controle de Planos</h3>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Lojista</th>
                    <th style={styles.th}>Proprietário</th>
                    <th style={styles.th}>Plano Vinculado</th>
                    <th style={styles.th}>Valor</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Tempo Restante</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Alterar Plano</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStores ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '24px', color: 'var(--outline)' }}>
                        Carregando dados das assinaturas...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '24px', color: 'var(--outline)' }}>
                        Nenhum lojista cadastrado.
                      </td>
                    </tr>
                  ) : (
                    stores.map(st => {
                      const activePlan = plans.find(p => p.id === st.planId);
                      
                      let remainingDaysText = 'Sem plano';
                      let remainingColor = 'var(--outline)';
                      
                      if (st.subscriptionStatus === 'active' && st.subscriptionEndsAt) {
                        const endsAt = new Date(st.subscriptionEndsAt).getTime();
                        const diffTime = endsAt - now;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                          remainingDaysText = `${diffDays} dias restantes`;
                          remainingColor = diffDays > 7 ? 'var(--tertiary)' : 'var(--secondary)';
                        } else {
                          remainingDaysText = 'Expirou hoje';
                          remainingColor = 'var(--secondary)';
                        }
                      } else if (st.subscriptionStatus === 'trial' && st.subscriptionEndsAt) {
                        const endsAt = new Date(st.subscriptionEndsAt).getTime();
                        const diffTime = endsAt - now;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                          remainingDaysText = `Trial: ${diffDays} dias`;
                          remainingColor = 'var(--outline)';
                        } else {
                          remainingDaysText = 'Trial Expirado';
                          remainingColor = 'var(--error)';
                        }
                      } else if (st.subscriptionStatus === 'inactive') {
                        remainingDaysText = 'Plano Expirado';
                        remainingColor = 'var(--error)';
                      }

                      return (
                        <tr key={st.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '700' }}>{st.name}</td>
                          <td style={styles.td}>{st.ownerName}</td>
                          <td style={{ ...styles.td }}>
                            <span style={{
                              backgroundColor: activePlan ? 'rgba(110, 0, 193, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                              color: activePlan ? 'var(--primary)' : 'var(--outline)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}>
                              {activePlan ? activePlan.title : 'Nenhum'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: '700' }}>
                            {activePlan ? formatCurrency(activePlan.price) : 'R$ 0,00'}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: st.subscriptionStatus === 'active' 
                                ? 'rgba(26, 115, 18, 0.08)' 
                                : st.subscriptionStatus === 'trial'
                                  ? 'rgba(0, 150, 136, 0.08)'
                                  : 'rgba(211, 47, 47, 0.08)',
                              color: st.subscriptionStatus === 'active' 
                                ? 'var(--tertiary)' 
                                : st.subscriptionStatus === 'trial'
                                  ? '#009688'
                                  : 'var(--error)'
                            }}>
                              {st.subscriptionStatus === 'active' ? 'Ativo' : st.subscriptionStatus === 'trial' ? 'Trial' : 'Inativo'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, color: remainingColor, fontWeight: '700' }}>
                            {remainingDaysText}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <select
                              value={st.planId || ''}
                              onChange={(e) => handleUpdateStorePlan(st.id, e.target.value || null)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--outline-variant)',
                                fontSize: '13px',
                                backgroundColor: '#ffffff',
                                color: 'var(--on-surface)',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              <option value="">-- Sem Plano / Inativo --</option>
                              {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.title} ({formatCurrency(p.price)})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Custom Delete Plan Confirmation Modal */}
      {deletePlanModal?.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIconContainer}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>delete_forever</span>
            </div>

            <h3 style={styles.modalTitle}>Excluir Plano</h3>

            <p style={styles.modalText}>
              Tem certeza que deseja excluir o plano <strong>{deletePlanModal.planTitle}</strong> permanentemente?
              <br />
              <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: '750', marginTop: '8px', display: 'block' }}>
                ⚠️ Lojistas assinando este plano perderão o acesso a essas configurações se o plano for removido.
              </span>
            </p>

            <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeletePlanModal(null)}
                style={styles.modalCancelBtn}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePlanConfirm}
                style={styles.modalConfirmBtn}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos Premium UÁRI Admin
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '14px 24px',
    color: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 99999,
    fontSize: '13px',
    fontWeight: '750',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: 'var(--outline)',
    fontWeight: '550',
  },
  tabContainer: {
    display: 'flex',
    gap: '16px',
    borderBottom: '1px solid var(--outline-variant)',
    marginBottom: '8px'
  },
  tabButton: {
    background: 'none',
    border: 'none',
    padding: '12px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '12px',
    color: 'var(--outline)',
    fontWeight: '750',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: '850',
    color: 'var(--on-surface)',
  },
  card: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 24px rgba(0,0,0,0.015)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    marginBottom: '16px',
  },
  cardSectionTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    margin: 0,
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  trHead: {
    borderBottom: '2px solid var(--surface-container-highest)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--outline)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--surface-container-highest)',
  },
  td: {
    padding: '16px',
    fontSize: '13px',
    color: 'var(--on-surface)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  payoutBtn: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(110,0,193,0.15)',
  },
  mainWorkspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftQueueColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightEditorColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  addPlanBtn: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(110,0,193,0.15)'
  },
  emptyPlansState: {
    padding: '48px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px dashed var(--outline-variant)',
    borderRadius: '12px',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '750px',
    overflowY: 'auto',
  },
  queueItemCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  queueProductTitle: {
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
  },
  priceTag: {
    backgroundColor: 'rgba(110,0,193,0.06)',
    color: 'var(--primary)',
    fontSize: '13px',
    fontWeight: '850',
    padding: '4px 12px',
    borderRadius: '6px',
  },
  editorHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  editorPreTitle: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '1px',
    marginBottom: '2px',
  },
  editorMainTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    margin: 0,
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '20px',
  },
  editorSectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  fieldInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
  },
  rowFormFields: {
    display: 'flex',
    gap: '16px',
  },
  fieldSelect: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    width: '100%',
  },
  fieldTextarea: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    resize: 'vertical',
    lineHeight: '18px',
  },
  fieldHelp: {
    fontSize: '10.5px',
    color: 'var(--outline)',
    fontWeight: '550',
  },
  imageSectionDesc: {
    fontSize: '11px',
    color: 'var(--outline)',
    margin: '2px 0 10px 0',
    fontWeight: '550',
  },
  featuresSubGroup: {
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featuresSubGroupTitle: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--outline-variant)',
    paddingBottom: '4px',
  },
  checkboxGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  checkboxInput: {
    width: '16px',
    height: '16px',
    marginTop: '2px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '12px',
    color: 'var(--on-surface)',
    cursor: 'pointer',
    lineHeight: '16px',
  },
  featureSelectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  savePlanSubmitBtn: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '9999px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(110,0,193,0.2)',
    width: '100%',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
  },
  modalContent: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '440px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--outline-variant)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
  },
  modalIconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '850',
    margin: 0,
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
  },
  modalText: {
    fontSize: '13.5px',
    color: 'var(--outline)',
    margin: 0,
    lineHeight: '20px',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    border: 'none',
    borderRadius: '9999px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'var(--error)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(186, 26, 26, 0.15)',
  }
};
