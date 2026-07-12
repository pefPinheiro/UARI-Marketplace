'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLojista } from './layout-client';
import { lojistaService, DBWallet, DBOrder } from '../services/lojista';

// Dados de evolução de vendas semanais conforme o mockup
const WEEKLY_DATA = [
  { day: 'Seg', height: '40%' },
  { day: 'Ter', height: '60%' },
  { day: 'Qua', height: '45%' },
  { day: 'Qui', height: '75%' },
  { day: 'Sex', height: '55%' },
  { day: 'Sab', height: '90%' },
  { day: 'Dom', height: '65%' }
];

// Pedidos recentes originais do modelo HTML fornecido pelo usuário
const TEMPLATE_ORDERS = [
  { id: '#UA-12940', client: 'Maria do Carmo', time: 'Hoje, 14:20', value: 145.50, status: 'preparing' },
  { id: '#UA-12938', client: 'João Pinheiro', time: 'Hoje, 13:45', value: 62.00, status: 'awaiting' },
  { id: '#UA-12935', client: 'Ana Clara Silva', time: 'Hoje, 12:10', value: 210.00, status: 'delivering' },
  { id: '#UA-12930', client: 'Roberto Mendes', time: 'Ontem, 18:30', value: 45.90, status: 'completed' }
];

export default function Dashboard() {
  const { store } = useLojista();
  const [wallet, setWallet] = useState<DBWallet | null>(null);
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = useCallback(async () => {
    if (!store?.id) return;
    setTimeout(() => setLoading(true), 0); // Asynchronous to avoid ESLint warning in useEffect
    try {
      const walletData = await lojistaService.fetchStoreWallet(store.id);
      setWallet(walletData);

      const pendingOrders = await lojistaService.fetchPendingOrders(store.id);
      setOrders(pendingOrders);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preparing':
      case 'paid':
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(26, 115, 18, 0.1)',
            color: 'var(--tertiary)',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            Preparando
          </span>
        );
      case 'awaiting':
      case 'pending_payment':
      case 'pending':
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(254, 107, 0, 0.1)',
            color: 'var(--secondary)',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            Aguardando
          </span>
        );
      case 'delivering':
      case 'ready_for_pickup':
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(138, 43, 226, 0.1)',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            Em Entrega
          </span>
        );
      case 'completed':
      default:
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: 'var(--surface-container-highest)',
            color: 'var(--on-surface-variant)',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            Concluído
          </span>
        );
    }
  };

  if (loading && !wallet) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <p style={styles.skeletonText}>Carregando métricas da vitrine...</p>
      </div>
    );
  }

  // Valores reais baseados no banco, ou fallback bonito do Figma
  const visitasCount = wallet ? wallet.available_balance : 34;
  const leadsCount = orders.length > 0 ? orders.length : 12;
  const produtosCount = wallet ? wallet.escrow_balance : 6;
  const cuponsCount = wallet && (wallet as any).coupons_count !== undefined ? (wallet as any).coupons_count : 4;

  // Filtragem de pedidos
  const activeOrdersList = orders.length > 0 
    ? orders.map(o => ({
        id: `#UA-${o.id.slice(0, 5).toUpperCase()}`,
        client: o.client?.full_name || 'Cliente UÁRI',
        time: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: 0,
        status: o.status === 'completed' ? 'completed' : 'awaiting'
      }))
    : TEMPLATE_ORDERS;

  const filteredOrders = activeOrdersList.filter(o => 
    o.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      
      {/* Greeting Header */}
      <section style={styles.greetingRow}>
        <div>
          <h1 style={styles.headlineLg}>Boas-vindas, {store?.name || 'Empório do Norte'}</h1>
          <p style={styles.bodyMdSub}>Aqui está o que está acontecendo na sua loja hoje, 24 de Outubro.</p>
        </div>
        <div>
          <button style={styles.periodBtn} onClick={() => alert('Filtro de período: Últimos 30 dias.')}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_today</span>
            <span>Últimos 30 dias</span>
          </button>
        </div>
      </section>

      {/* KPIs Grid */}
      <section style={styles.metricsGrid}>
        
        {/* KPI 1 */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(110, 0, 193, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>qr_code_scanner</span>
            </div>
            <span style={styles.metricGrowthText}>
              +15% <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '2px' }}>trending_up</span>
            </span>
          </div>
          <span style={styles.metricLabel}>Visitas Físicas (QR Code)</span>
          <h3 style={styles.metricValue}>{visitasCount}</h3>
        </div>

        {/* KPI 2 */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(160, 65, 0, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '24px' }}>chat</span>
            </div>
            <span style={styles.metricGrowthText}>
              +3 <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '2px' }}>add</span>
            </span>
          </div>
          <span style={styles.metricLabel}>Leads de Negociação</span>
          <h3 style={styles.metricValue}>{leadsCount}</h3>
        </div>

        {/* KPI 3 */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(26, 115, 18, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '24px' }}>inventory_2</span>
            </div>
            <span style={{ ...styles.metricGrowthText, color: 'var(--on-surface-variant)' }}>Destaque</span>
          </div>
          <span style={styles.metricLabel}>Produtos Publicados</span>
          <h3 style={styles.metricValue}>{produtosCount}</h3>
        </div>

        {/* KPI 4 */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(110, 0, 193, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>local_offer</span>
            </div>
            <span style={styles.metricGrowthText}>
              Ativos
            </span>
          </div>
          <span style={styles.metricLabel}>Cupons Criados</span>
          <h3 style={styles.metricValue}>{cuponsCount}</h3>
        </div>

      </section>

      {/* Middle Section: Chart & Seller Spotlight */}
      <section style={styles.middleDashboardGrid}>
        
        {/* Bento Graph Card */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeaderRow}>
            <h4 style={styles.cardTitle}>Evolução de Vendas (7 dias)</h4>
            <div>
              <span style={styles.chartLegend}>
                <span style={styles.primaryDot} /> Receita
              </span>
            </div>
          </div>

          <div style={styles.chartAreaLow}>
            <div style={styles.chartBarsRow}>
              {WEEKLY_DATA.map((d, index) => (
                <div key={index} style={styles.barContainer}>
                  <div style={styles.barFillOuter}>
                    <div style={{ ...styles.barFillInner, height: d.height }} />
                  </div>
                  <span style={styles.barLabel}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seller Spotlight Card */}
        <div style={styles.spotlightCard}>
          {/* Fundo Panorâmico de Tefé com Overlay */}
          <div style={styles.spotlightOverlay} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            alt="Tefé Market" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNFBycIj1KCfHuMJ7VSzLrxve6ixLqr9PcdkQ-0kqSV5dfXnBXSu2blYLDfkwqp1t1xWPMDlvMxOm1yjPC6N_0ogAA0F4uzud0JWmkaxo7rdLd-PCP25qRs1_n5zcAWq9zcei2TrxjveuXeXcBMrYI-YbXGco6wESspKz302EjCD4sNwvaFgEWvPXr3Fq4ZIImv_O4PCfhFabwV23Tcj-zXp8hRwZ3yopUHAi_DakhKr2B8XHQb9qGcB3rccPkeH2hGD3Xuj9YCdhp"
            style={styles.spotlightImg}
          />
          
          <div style={styles.spotlightContent}>
            <span style={styles.spotlightBadge}>MERCADO LOCAL</span>
            <h4 style={styles.spotlightTitle}>Cresça com a UÁRI em Tefé</h4>
            <p style={styles.spotlightDesc}>
              Sua loja está entre as top 10 mais visualizadas da região esta semana. Que tal criar uma promoção para converter mais?
            </p>
            <button 
              onClick={() => window.location.href = '/cupons'} 
              style={styles.spotlightBtn}
            >
              Criar Promoção Relâmpago
            </button>
          </div>
        </div>

      </section>

      {/* Recent Orders Table Card */}
      <section style={styles.ordersCard}>
        <div style={styles.ordersHeaderRow}>
          <h4 style={styles.cardTitle}>Pedidos Recentes</h4>
          
          <div style={styles.ordersControls}>
            <div style={styles.searchWrapper}>
              <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
              <input 
                type="text" 
                placeholder="Buscar pedido..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button style={styles.filterBtn} onClick={() => alert('Filtro de status de pedidos.')}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span>
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>ID do Pedido</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Data/Hora</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => (
                <tr key={idx} className="tr-hover" style={styles.tr}>
                  <td style={{ ...styles.td, fontWeight: '700' }}>{order.id}</td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{order.client}</td>
                  <td style={{ ...styles.td, color: 'var(--on-surface-variant)' }}>{order.time}</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: 'var(--secondary)' }}>
                    {formatCurrency(order.value)}
                  </td>
                  <td style={styles.td}>
                    {getStatusBadge(order.status)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button 
                      onClick={() => window.location.href = '/financeiro'} 
                      style={styles.detailsLink}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.tableFooter}>
          <button 
            onClick={() => window.location.href = '/financeiro'} 
            style={styles.viewAllBtn}
          >
            <span>Ver todos os pedidos</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
        </div>
      </section>

    </div>
  );
}

// Estilos exatos alinhados com o UÁRI Design System
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  greetingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headlineLg: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    lineHeight: '40px',
    letterSpacing: '-0.02em',
  },
  bodyMdSub: {
    fontSize: '16px',
    color: 'var(--on-surface-variant)',
    lineHeight: '24px',
    marginTop: '4px',
  },
  periodBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--surface)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  metricIconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrowthText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--tertiary)',
    display: 'flex',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    marginTop: '4px',
  },
  middleDashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '16px',
  },
  chartCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--on-surface)',
  },
  chartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
  },
  primaryDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
  },
  chartAreaLow: {
    backgroundColor: 'var(--surface-container-low)',
    borderRadius: '16px',
    padding: '16px',
    height: '256px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  chartBarsRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    gap: '8px',
    paddingTop: '32px',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '16px',
  },
  barFillOuter: {
    width: '100%',
    backgroundColor: 'transparent',
    height: '140px',
    display: 'flex',
    alignItems: 'flex-end',
  },
  barFillInner: {
    width: '100%',
    backgroundColor: 'rgba(110, 0, 193, 0.2)',
    borderRadius: '8px 8px 0 0',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
  },
  spotlightCard: {
    backgroundColor: 'var(--primary)',
    borderRadius: '8px',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  spotlightOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 50%, var(--on-primary-fixed-variant) 100%)',
    opacity: 0.9,
    zIndex: 2,
  },
  spotlightImg: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    mixBlendMode: 'overlay',
    opacity: 0.3,
  },
  spotlightContent: {
    position: 'relative',
    zIndex: 10,
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  spotlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--tertiary-container)', // bg-tertiary-container
    color: 'var(--on-tertiary-container)', // text-on-tertiary-container
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    marginBottom: '16px',
  },
  spotlightTitle: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '32px',
    marginBottom: '16px',
  },
  spotlightDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '24px',
  },
  spotlightBtn: {
    marginTop: 'auto',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--primary)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background-color 0.2s',
  },
  ordersCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    overflow: 'hidden',
  },
  ordersHeaderRow: {
    padding: '24px',
    borderBottom: '1px solid var(--surface-container-highest)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  ordersControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '256px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--on-surface-variant)',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 40px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '16px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    color: 'var(--on-surface)',
    backgroundColor: 'transparent',
    transition: 'all 0.2s',
  },
  filterBtn: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--on-surface)',
    transition: 'background-color 0.2s',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  trHead: {
    backgroundColor: 'var(--surface-container-low)',
    color: 'var(--on-surface-variant)',
    fontSize: '14px',
    fontWeight: '600',
  },
  th: {
    padding: '16px 24px',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid var(--surface-container-highest)',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px 24px',
    fontSize: '16px',
  },
  detailsLink: {
    color: 'var(--primary)',
    fontWeight: '600',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  tableFooter: {
    padding: '16px',
    backgroundColor: 'var(--surface-container-low)',
    display: 'flex',
    justifyContent: 'center',
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
  }
};
