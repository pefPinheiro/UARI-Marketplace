'use client';

import React, { useState } from 'react';

interface Raffle {
  id: string;
  title: string;
  prize: string;
  drawDate: string;
  ticketsCount: number;
  status: 'active' | 'completed';
}

interface PointRule {
  id: string;
  action: string;
  points: number;
  isActive: boolean;
}

export default function SorteiosGamificacaoPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([
    { id: '1', title: 'Grande Sorteio da Castanha 🌰', prize: 'Smartphone Samsung S24 Ultra', drawDate: '30/08/2026', ticketsCount: 1240, status: 'active' },
    { id: '2', title: 'Sorteio de Fim de Safra 🐟', prize: 'Vale-Compras de R$ 1.500,00', drawDate: '15/09/2026', ticketsCount: 600, status: 'active' },
    { id: '3', title: 'Sorteio de Inauguração UÁRI 🚀', prize: 'Smart TV 55 polegadas 4K', drawDate: '01/07/2026', ticketsCount: 2310, status: 'completed' }
  ]);

  const [rules, setRules] = useState<PointRule[]>([
    { id: 'r1', action: 'Visita Diária ao Lojista Virtual', points: 5, isActive: true },
    { id: 'r2', action: 'Primeira Compra no Marketplace', points: 50, isActive: true },
    { id: 'r3', action: 'Avaliação de Produto com Foto', points: 15, isActive: true },
    { id: 'r4', action: 'Indicação de Novo Cliente (Cadastro)', points: 30, isActive: false }
  ]);

  const handleCreateRaffle = () => {
    alert('🏆 Funcionalidade de Sorteios em fase de especificação do produto. O layout visual já está pronto para aprovação!');
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Sorteios & Gamificação</h1>
          <p style={styles.pageSubtitle}>Gerencie campanhas de fidelidade, regras de acúmulo de pontos e bilhetes virtuais de Tefé.</p>
        </div>
        <button type="button" onClick={handleCreateRaffle} style={styles.primaryBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
          <span>Criar Novo Sorteio</span>
        </button>
      </section>

      {/* Bento KPIs */}
      <section style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total de Pontos Emitidos</span>
          <div style={{ ...styles.metricValue, color: 'var(--primary)' }}>45.200 pts</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Sorteios em Andamento</span>
          <div style={{ ...styles.metricValue, color: 'var(--secondary)' }}>2 Ativos</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Bilhetes Virtuais Gerados</span>
          <div style={{ ...styles.metricValue, color: 'var(--tertiary)' }}>1.840 unid</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Prêmios já Entregues</span>
          <div style={{ ...styles.metricValue, color: '#1a7312' }}>12 prêmios</div>
        </div>
      </section>

      {/* Content Layout */}
      <div style={styles.mainGrid}>
        
        {/* Left Column: Campanhas Ativas */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>draw</span>
              <h2 style={styles.cardTitle}>Sorteios Cadastrados</h2>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Título do Sorteio</th>
                    <th style={styles.th}>Prêmio Principal</th>
                    <th style={styles.th}>Data do Sorteio</th>
                    <th style={styles.th}>Bilhetes</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map(r => (
                    <tr key={r.id} style={styles.trRow}>
                      <td style={{ ...styles.td, fontWeight: '750' }}>{r.title}</td>
                      <td style={styles.td}>{r.prize}</td>
                      <td style={styles.td}>{r.drawDate}</td>
                      <td style={{ ...styles.td, fontWeight: '700', color: 'var(--outline)' }}>{r.ticketsCount}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: r.status === 'active' ? 'rgba(26, 115, 18, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                          color: r.status === 'active' ? '#1a7312' : 'var(--outline)'
                        }}>
                          ● {r.status === 'active' ? 'Ativo' : 'Concluído'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Regras de Fidelidade */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>toll</span>
              <h2 style={styles.cardTitle}>Regras de Gamificação</h2>
            </div>
            
            <p style={styles.cardDesc}>Defina quantos pontos virtuais o cliente recebe ao realizar ações na vitrine de Tefé.</p>

            <div style={styles.rulesList}>
              {rules.map(rule => (
                <div key={rule.id} style={styles.ruleCard}>
                  <div style={styles.ruleInfo}>
                    <span style={styles.ruleAction}>{rule.action}</span>
                    <span style={styles.rulePoints}>+{rule.points} pontos</span>
                  </div>

                  <div style={styles.toggleWrapper} onClick={() => toggleRule(rule.id)}>
                    <div style={{
                      ...styles.toggleSwitchBg,
                      backgroundColor: rule.isActive ? 'var(--tertiary)' : 'var(--outline-variant)'
                    }}>
                      <div style={{
                        ...styles.toggleSwitchCircle,
                        transform: rule.isActive ? 'translateX(20px)' : 'translateX(0px)'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Estilos
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: 'var(--on-surface-variant)',
  },
  primaryBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '12px 24px',
    fontSize: '13.5px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(110, 0, 193, 0.15)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '13px',
    color: 'var(--outline)',
    fontWeight: '700',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '850',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    margin: 0,
  },
  cardDesc: {
    fontSize: '12.5px',
    color: 'var(--outline)',
    margin: 0,
    fontWeight: '600',
    lineHeight: '16px',
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
    borderBottom: '1px solid var(--surface-container-highest)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--outline)',
    textTransform: 'uppercase',
  },
  trRow: {
    borderBottom: '1px solid var(--surface-container-highest)',
  },
  td: {
    padding: '16px',
    fontSize: '13.5px',
    color: 'var(--on-surface)',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '750',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ruleCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
    padding: '14px 16px',
  },
  ruleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  ruleAction: {
    fontSize: '13.5px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  rulePoints: {
    fontSize: '12px',
    color: 'var(--tertiary)',
    fontWeight: '800',
  },
  toggleWrapper: {
    cursor: 'pointer',
  },
  toggleSwitchBg: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    padding: '2px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  toggleSwitchCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    transition: 'transform 0.2s ease-in-out',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
  }
};
