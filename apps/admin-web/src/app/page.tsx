'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Estado para interatividade no Feed de Atividades
  const [storeApproved, setStoreApproved] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalApproved, setWithdrawalApproved] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Tratador de Aprovação de Loja
  const handleApproveStore = () => {
    setStoreApproved(true);
    alert('🎉 Cadastro da "Loja de Ferragens W." aprovado e ativado no banco de dados com sucesso!');
  };

  // Tratador de Aprovação de Saque
  const handleApproveWithdrawal = () => {
    setWithdrawalApproved(true);
    setShowWithdrawalModal(false);
    alert('💸 Transferência Pix de R$ 2.450,00 autorizada e liquidada com sucesso para Moda Regional Tefé!');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div style={styles.container}>
      
      {/* Top Banner Header */}
      <section style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Dashboard Master</h1>
        <p style={styles.pageSubtitle}>
          Torre de controle operacional do marketplace de Tefé. <span style={styles.italicQuote}>&quot;Quebra essa castanha&quot;</span>
        </p>
      </section>

      {/* Bento Grid KPIs */}
      <section style={styles.metricsGrid}>
        
        {/* KPI 1: Faturamento Global */}
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>FATURAMENTO GLOBAL (GMV)</span>
          <div style={styles.kpiValue}>{formatCurrency(450200.00)}</div>
          <span style={styles.growthBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--tertiary)' }}>trending_up</span>
            <span>+12% este mês</span>
          </span>
        </div>

        {/* KPI 2: Comissões Retidas */}
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>COMISSÕES RETIDAS</span>
          <div style={styles.kpiValue}>{formatCurrency(67530.00)}</div>
          <span style={styles.kpiHelperText}>Processamento automático ativo</span>
        </div>

        {/* KPI 3: Novos Cadastros */}
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>NOVOS CADASTROS (30D)</span>
          <div style={styles.kpiRegisterRow}>
            <div>
              <span style={styles.registerVal}>142</span>
              <span style={styles.registerLabel}>Usuários</span>
            </div>
            <div style={styles.registerDivider} />
            <div>
              <span style={styles.registerVal}>18</span>
              <span style={styles.registerLabel}>Lojistas</span>
            </div>
          </div>
          <span style={{ ...styles.kpiHelperText, marginTop: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>history</span>
            Atualizado há 5 min
          </span>
        </div>

        {/* KPI 4: Saques Pendentes (Estilo Alerta do Figma) */}
        <Link href="/financeiro" style={styles.kpiCardWarning}>
          <span style={styles.warningLabel}>SAQUES PENDENTES</span>
          <div style={styles.warningValue}>
            {withdrawalApproved ? '4' : '5'} <span style={{ fontSize: '20px', fontWeight: '600' }}>Solicitações</span>
          </div>
          <div style={styles.warningFooterRow}>
            <span>Ação requerida</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </div>
          <span className="material-symbols-outlined" style={styles.warningIconBg}>warning</span>
        </Link>

      </section>

      {/* Split Grid: Charts & Activity Feed */}
      <div style={styles.splitGrid}>
        
        {/* Lado Esquerdo: Gráficos de Vendas & Transações */}
        <div style={styles.leftChartsContainer}>
          
          {/* Card Gráfico 1: Vendas por Categoria */}
          <section style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Vendas por Categoria</h3>
              <Link href="/produtos" style={styles.viewAllLink}>
                <span>Ver todos</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_outward</span>
              </Link>
            </div>

            {/* Custom high fidelity HTML/CSS Bar Chart */}
            <div style={styles.barChartWrapper}>
              <div style={styles.barChartContainer}>
                
                {/* Categoria 1: Moda */}
                <div style={styles.chartColumnGroup}>
                  <div style={styles.columnTrack}>
                    <div style={{ ...styles.columnFill, height: '45%', backgroundColor: 'var(--primary-container)' }} />
                  </div>
                  <span style={styles.columnLabel}>Moda</span>
                </div>

                {/* Categoria 2: Alimentos */}
                <div style={styles.chartColumnGroup}>
                  <div style={styles.columnTrack}>
                    <div style={{ ...styles.columnFill, height: '85%', backgroundColor: 'var(--primary)' }} />
                  </div>
                  <span style={styles.columnLabel}>Alimentos</span>
                </div>

                {/* Categoria 3: Eletrônicos */}
                <div style={styles.chartColumnGroup}>
                  <div style={styles.columnTrack}>
                    <div style={{ ...styles.columnFill, height: '30%', backgroundColor: 'var(--secondary)' }} />
                  </div>
                  <span style={styles.columnLabel}>Eletrônicos</span>
                </div>

                {/* Categoria 4: Casa */}
                <div style={styles.chartColumnGroup}>
                  <div style={styles.columnTrack}>
                    <div style={{ ...styles.columnFill, height: '60%', backgroundColor: 'var(--tertiary)' }} />
                  </div>
                  <span style={styles.columnLabel}>Casa</span>
                </div>

                {/* Categoria 5: Outros */}
                <div style={styles.chartColumnGroup}>
                  <div style={styles.columnTrack}>
                    <div style={{ ...styles.columnFill, height: '20%', backgroundColor: 'var(--outline)' }} />
                  </div>
                  <span style={styles.columnLabel}>Outros</span>
                </div>

              </div>
            </div>
          </section>

          {/* Card Gráfico 2: Transações por Dia da Semana */}
          <section style={{ ...styles.chartCard, marginTop: '24px' }}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Transações por Dia da Semana</h3>
              <div style={styles.chartLegendRow}>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: 'var(--tertiary)' }} />
                  Concluídas
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: 'var(--error)' }} />
                  Canceladas
                </span>
              </div>
            </div>

            {/* Gorgeous SVG wave/line chart */}
            <div style={styles.waveChartWrapper}>
              <svg viewBox="0 0 500 120" style={styles.svgCanvas}>
                {/* Grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(0,0,0,0.03)" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(0,0,0,0.03)" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(0,0,0,0.03)" />
                
                {/* Concluídas wave */}
                <path 
                  d="M0,90 Q80,10 160,80 T320,40 T480,20 L500,20 L500,120 L0,120 Z" 
                  fill="rgba(26, 115, 18, 0.05)" 
                />
                <path 
                  d="M0,90 Q80,10 160,80 T320,40 T480,20" 
                  fill="none" 
                  stroke="var(--tertiary)" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />

                {/* Canceladas wave */}
                <path 
                  d="M0,110 Q100,100 200,95 T400,105 T500,102" 
                  fill="none" 
                  stroke="var(--error)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Dots at key peaks */}
                <circle cx="80" cy="40" r="4" fill="var(--tertiary)" />
                <circle cx="320" cy="40" r="4" fill="var(--tertiary)" />
                <circle cx="480" cy="20" r="4" fill="var(--tertiary)" />
              </svg>
              <div style={styles.waveLabelsRow}>
                <span>DOM</span>
                <span>SEG</span>
                <span>TER</span>
                <span>QUA</span>
                <span>QUI</span>
                <span>SEX</span>
                <span>SAB</span>
              </div>
            </div>
          </section>

        </div>

        {/* Lado Direito: Feed de Atividades */}
        <section style={styles.rightFeedCard}>
          <div style={styles.feedHeaderRow}>
            <h3 style={styles.chartTitle}>Feed de Atividade</h3>
            <span style={styles.feedPulseDot} />
          </div>

          <div style={styles.feedList}>
            
            {/* Item 1: Nova Promoção */}
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedIconBg, backgroundColor: 'rgba(26, 115, 18, 0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '18px' }}>campaign</span>
              </div>
              <div style={styles.feedContent}>
                <p style={styles.feedText}>
                  <strong>Loja Amazônia Viva</strong> criou uma nova promoção: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>&quot;Festival da Castanha&quot;</span>.
                </p>
                <span style={styles.feedTime}>há 2 minutos</span>
              </div>
            </div>

            {/* Item 2: Usuário comprou item */}
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedIconBg, backgroundColor: 'rgba(110, 0, 193, 0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>shopping_cart</span>
              </div>
              <div style={styles.feedContent}>
                <p style={styles.feedText}>
                  <strong>Usuário Carlos Silva</strong> comprou o item <span style={{ fontWeight: '600' }}>Artesanato de Tucumã</span>.
                </p>
                <span style={styles.feedTime}>há 15 minutos</span>
              </div>
            </div>

            {/* Item 3: Novo Cadastro Solicitado (Interativo) */}
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedIconBg, backgroundColor: 'rgba(254, 107, 0, 0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '18px' }}>person_add</span>
              </div>
              <div style={styles.feedContent}>
                <p style={styles.feedText}>
                  <strong>Novo cadastro solicitado</strong> pela <span style={{ fontWeight: '600' }}>Loja de Ferragens W.</span>
                </p>
                <span style={styles.feedTime}>há 45 minutos</span>

                {/* Botões de Ação Inline */}
                {!storeApproved ? (
                  <div style={styles.feedActionBtns}>
                    <button onClick={handleApproveStore} style={styles.approveBtn}>APROVAR</button>
                    <button onClick={() => setShowReviewModal(true)} style={styles.reviewBtn}>REVISAR</button>
                  </div>
                ) : (
                  <div style={styles.approvedBadge}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>check_circle</span>
                    Aprovado por Admin Master ✓
                  </div>
                )}
              </div>
            </div>

            {/* Item 4: Solicitação de Saque (Interativa) */}
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedIconBg, backgroundColor: 'rgba(186, 26, 26, 0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '18px' }}>account_balance_wallet</span>
              </div>
              <div style={styles.feedContent}>
                <p style={styles.feedText}>
                  <strong>Solicitação de saque</strong> no valor de <span style={{ color: 'var(--error)', fontWeight: '700' }}>R$ 2.450,00</span> por <span style={{ fontWeight: '600' }}>Moda Regional Tefé</span>.
                </p>
                <span style={styles.feedTime}>há 1 hora</span>

                {/* Botão para abrir o modal de transferência */}
                {!withdrawalApproved ? (
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => setShowWithdrawalModal(true)} style={styles.payoutTriggerBtn}>
                      Apurar Transferência
                    </button>
                  </div>
                ) : (
                  <div style={styles.approvedBadge}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>payments</span>
                    Liquidado via Pix ✓
                  </div>
                )}
              </div>
            </div>

            {/* Item 5: Relatório Semanal */}
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedIconBg, backgroundColor: 'rgba(126, 115, 134, 0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '18px' }}>schedule</span>
              </div>
              <div style={styles.feedContent}>
                <p style={styles.feedText}>
                  <strong>Relatório semanal</strong> de conciliação de Tefé foi gerado para auditoria.
                </p>
                <span style={styles.feedTime}>há 2 horas</span>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Modal 1: Revisar Loja */}
      {showReviewModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Revisão Cadastral</h3>
            <p style={styles.modalDesc}>Valide as especificações comerciais da proposta da loja antes de aprovar.</p>
            
            <div style={styles.reviewDetailsBox}>
              <div><strong>Nome da Loja:</strong> Loja de Ferragens W.</div>
              <div><strong>Proprietário:</strong> Walmir Lima Silveira</div>
              <div><strong>Cidade/Local:</strong> Centro - Tefé, AM</div>
              <div><strong>Categoria:</strong> Casa e Construção</div>
              <div><strong>Catálogo proposto:</strong> 8 produtos prontos p/ expor</div>
              <div><strong>Documento Cadastrado:</strong> CNPJ regularizado</div>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={() => { setStoreApproved(true); setShowReviewModal(false); }}
                style={{ ...styles.approveBtn, padding: '10px 24px', fontSize: '13px' }}
              >
                Aprovar Agora
              </button>
              <button onClick={() => setShowReviewModal(false)} style={styles.modalCloseBtn}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Apuração de Saque */}
      {showWithdrawalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
            <h3 style={styles.modalTitle}>Autorizar Repasse Financeiro</h3>
            <p style={styles.modalDesc}>Confirme a liquidação do Pix do lojista para faturamento verificado offline.</p>
            
            <div style={styles.reviewDetailsBox}>
              <div><strong>Loja Favorecida:</strong> Moda Regional Tefé</div>
              <div><strong>Valor Bruto:</strong> R$ 2.450,00</div>
              <div><strong>Taxa da Plataforma UÁRI (10%):</strong> -R$ 245,00</div>
              <div style={{ borderTop: '1px dashed var(--outline-variant)', marginTop: '8px', paddingTop: '8px', color: 'var(--tertiary)' }}>
                <strong>VALOR LÍQUIDO A TRANSFERIR:</strong> R$ 2.205,00
              </div>
              <div><strong>Chave Pix cadastrada:</strong> financeiro@modatefe.com</div>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={handleApproveWithdrawal}
                style={{ ...styles.approveBtn, padding: '10px 24px', fontSize: '13px' }}
              >
                Autorizar Pix ⚡
              </button>
              <button onClick={() => setShowWithdrawalModal(false)} style={styles.modalCloseBtn}>Voltar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos premium inline baseados no UÁRI Design System
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: 'var(--on-surface-variant)',
  },
  italicQuote: {
    fontStyle: 'italic',
    color: 'var(--tertiary)',
    fontWeight: '600',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  kpiCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--outline)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    marginTop: '8px',
    marginBottom: '8px',
  },
  growthBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--tertiary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  kpiHelperText: {
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  kpiRegisterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '10px',
  },
  registerVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    display: 'block',
  },
  registerLabel: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '700',
  },
  registerDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--surface-container-highest)',
  },
  kpiCardWarning: {
    backgroundColor: '#FFEBEE', // Fundo vermelho sutil do Figma
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(186, 26, 26, 0.15)',
    boxShadow: '0px 4px 20px rgba(186, 26, 26, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  warningLabel: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--error)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  warningValue: {
    fontSize: '28px',
    fontWeight: '850',
    color: 'var(--error)',
    marginTop: '8px',
    marginBottom: '8px',
  },
  warningFooterRow: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  warningIconBg: {
    position: 'absolute',
    right: '-16px',
    bottom: '-16px',
    fontSize: '100px',
    color: 'rgba(186, 26, 26, 0.05)',
    pointerEvents: 'none',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  leftChartsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  chartCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
  },
  viewAllLink: {
    fontSize: '13px',
    fontWeight: '750',
    color: 'var(--primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  barChartWrapper: {
    height: '180px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '8px',
  },
  barChartContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    height: '100%',
    alignItems: 'flex-end',
    padding: '0 20px',
  },
  chartColumnGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  columnTrack: {
    height: '130px',
    width: '18px',
    backgroundColor: 'var(--surface-container-low)',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
  },
  columnFill: {
    width: '100%',
    borderRadius: '8px',
    transition: 'height 0.8s ease-in-out',
  },
  columnLabel: {
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
  },
  chartLegendRow: {
    display: 'flex',
    gap: '16px',
  },
  legendItem: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--outline)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  waveChartWrapper: {
    height: '180px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  svgCanvas: {
    width: '100%',
    height: '140px',
  },
  waveLabelsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '700',
  },
  rightFeedCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
  },
  feedHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '12px',
  },
  feedPulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--tertiary)',
    animation: 'spin 2s linear infinite',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  feedItem: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
  },
  feedIconBg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  feedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  feedText: {
    fontSize: '13px',
    lineHeight: '18px',
    color: 'var(--on-surface)',
  },
  feedTime: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
  },
  feedActionBtns: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  approveBtn: {
    padding: '6px 16px',
    backgroundColor: 'var(--tertiary)', // Verde escuro
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  reviewBtn: {
    padding: '6px 16px',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  approvedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '6px',
    color: 'var(--tertiary)',
    fontSize: '12px',
    fontWeight: '800',
  },
  payoutTriggerBtn: {
    padding: '6px 12px',
    backgroundColor: 'var(--error)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(3px)',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    border: '1px solid var(--surface-container-highest)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
  },
  modalDesc: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    marginTop: '4px',
    marginBottom: '20px',
  },
  reviewDetailsBox: {
    width: '100%',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
    color: 'var(--on-surface)',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  modalCloseBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
  }
};
