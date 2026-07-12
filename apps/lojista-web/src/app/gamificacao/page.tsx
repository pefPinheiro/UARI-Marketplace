'use client';

import React, { useState, useEffect } from 'react';
import { useLojista } from '../layout-client';

// Clientes mockados de Tefé-AM para o sorteio dinâmico
const MOCK_CLIENTS_TEFE = [
  'Raimundo Nonato Costa',
  'Maria Eduarda Silva',
  'João de Castanha',
  'Antônia de Souza',
  'Clarice Amazonas',
  'Francisco de Assis Ferreira',
  'Teresa de Jesus Batista',
  'Valter da Silva Porto',
  'Glória da Costa Melo',
  'Sebastião Ribeiro',
  'Juliana Barbosa Castro',
  'Manoel de Oliveira Lima'
];

interface Raffle {
  id: string;
  title: string;
  prize: string;
  criteria: string;
  date: string;
  winnersCount: number;
  status: 'active' | 'completed';
  ticketsCount: number;
}

interface Winner {
  id: string;
  name: string;
  ticket: string;
  raffleTitle: string;
  date: string;
  prize: string;
  status: 'pending' | 'delivered';
}

export default function GamificacaoPage() {
  const { store } = useLojista();

  // Estado dos Sorteios
  const [raffles, setRaffles] = useState<Raffle[]>([
    {
      id: '1',
      title: 'Açaí de Ouro - 10 Litros',
      prize: '10L de Polpa de Açaí Especial',
      criteria: 'Compras acima de R$ 50,00',
      date: '30 Mai, 2026',
      winnersCount: 1,
      status: 'active',
      ticketsCount: 124
    },
    {
      id: '2',
      title: 'Artesanato Local Elegante',
      prize: 'Cesto de Palha Tucumã G + Farinheira',
      criteria: 'PIX Direto Offline',
      date: '12 Jun, 2026',
      winnersCount: 1,
      status: 'active',
      ticketsCount: 89
    },
    {
      id: '3',
      title: 'Campanha Regional Tefé',
      prize: '5kg de Farinha de Uarini Ovinha',
      criteria: 'Apenas seguidores da vitrine',
      date: '15 Mai, 2026',
      winnersCount: 1,
      status: 'completed',
      ticketsCount: 154
    }
  ]);

  // Estado de Ganhadores
  const [winners, setWinners] = useState<Winner[]>([
    {
      id: 'w1',
      name: 'Ana Paula Mendes',
      ticket: '#UA-SRT-8472',
      raffleTitle: 'Campanha Regional Tefé',
      date: '15 Mai, 2026',
      prize: '5kg de Farinha de Uarini Ovinha',
      status: 'delivered'
    },
    {
      id: 'w2',
      name: 'Carlos Santos',
      ticket: '#UA-SRT-1903',
      raffleTitle: 'Festival das Flores',
      date: '10 Mai, 2026',
      prize: 'Kits Perfumes da Amazônia',
      status: 'pending'
    }
  ]);

  // Estados dos Formulários
  const [newTitle, setNewTitle] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [newCriteria, setNewCriteria] = useState('Compras acima de R$ 30,00');
  const [newDate, setNewDate] = useState('');
  const [newWinnersCount, setNewWinnersCount] = useState('1');

  // Estados do Simulador de Sorteio Reativo
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingProgress, setDrawingProgress] = useState(0);
  const [drawingStepText, setDrawingStepText] = useState('');
  const [activeRaffleId, setActiveRaffleId] = useState<string | null>(null);
  const [drawnWinner, setDrawnWinner] = useState<Winner | null>(null);
  const [showConfettiPopup, setShowConfettiPopup] = useState(false);

  // Finaliza a simulação e escolhe o ganhador aleatoriamente
  function finalizeDraw() {
    if (!activeRaffleId) return;

    const raffle = raffles.find((r) => r.id === activeRaffleId);
    if (!raffle) return;

    // Escolhe cliente aleatório
    const randomClientIndex = Math.floor(Math.random() * MOCK_CLIENTS_TEFE.length);
    const clientName = MOCK_CLIENTS_TEFE[randomClientIndex];
    const ticketCode = `#UA-SRT-${Math.floor(Math.random() * 8999 + 1000)}`;

    const newWinner: Winner = {
      id: `w-${Date.now()}`,
      name: clientName,
      ticket: ticketCode,
      raffleTitle: raffle.title,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      prize: raffle.prize,
      status: 'pending'
    };

    // Atualiza estados
    setWinners((prev) => [newWinner, ...prev]);
    setRaffles((prev) =>
      prev.map((r) => (r.id === activeRaffleId ? { ...r, status: 'completed' } : r))
    );
    setDrawnWinner(newWinner);
    setShowConfettiPopup(true);
    setIsDrawing(false);
    setDrawingProgress(0);
    setActiveRaffleId(null);
  };

  // Efeito da simulação do sorteio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDrawing) {
      interval = setInterval(() => {
        setDrawingProgress((prev) => {
          const next = prev + 2;
          
          // Altera os textos explicativos durante o embaralhamento
          if (next < 30) {
            setDrawingStepText('🌀 Misturando os cupons da urna digital de Tefé-AM...');
          } else if (next < 65) {
            setDrawingStepText('🔍 Filtrando cupons ativos baseados nos critérios promocionais...');
          } else if (next < 90) {
            setDrawingStepText('⚡ Decodificando handshakes e assinaturas da vitrine...');
          } else {
            setDrawingStepText('🏆 Selecionando o cupom sorteado de forma auditável...');
          }

          if (next >= 100) {
            clearInterval(interval);
            finalizeDraw();
            return 100;
          }
          return next;
        });
      }, 60);
    }
    return () => clearInterval(interval);
  }, [isDrawing]);

  // Criação de Sorteio
  const handleCreateRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrize.trim()) return;

    const formattedDate = newDate 
      ? new Date(newDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '30 Jun, 2026';

    const newRaffle: Raffle = {
      id: String(Date.now()),
      title: newTitle,
      prize: newPrize,
      criteria: newCriteria,
      date: formattedDate,
      winnersCount: parseInt(newWinnersCount) || 1,
      status: 'active',
      ticketsCount: Math.floor(Math.random() * 150 + 10)
    };

    setRaffles((prev) => [newRaffle, ...prev]);
    setNewTitle('');
    setNewPrize('');
    setNewDate('');
    setNewWinnersCount('1');
    alert('🎉 Campanha de Sorteio ativada e lançada com sucesso na vitrine!');
  };

  // Inicia o sorteio
  const triggerDraw = (id: string) => {
    setActiveRaffleId(id);
    setIsDrawing(true);
    setDrawingProgress(0);
  };

  // Alterna status de entrega do prêmio
  const toggleWinnerStatus = (id: string) => {
    setWinners((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'pending' ? 'delivered' : 'pending' } : w
      )
    );
  };

  // Métricas calculadas
  const activeRafflesCount = raffles.filter((r) => r.status === 'active').length;
  const totalTicketsCount = raffles.reduce((acc, r) => acc + r.ticketsCount, 0);
  const totalCompletedRaffles = raffles.filter((r) => r.status === 'completed').length;
  const lastWinnerName = winners[0]?.name || 'Nenhum';

  return (
    <div style={styles.container}>
      
      {/* Top Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Gamificação & Sorteios</h1>
          <p style={styles.pageSubtitle}>Crie engajamento na vitrine com sorteios auditáveis e premie seus melhores clientes.</p>
        </div>
      </section>

      {/* Grid Bento de Métricas */}
      <section style={styles.metricsGrid}>
        
        {/* KPI 1: Sorteios Ativos */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(110, 0, 193, 0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>stars</span>
            </div>
            <span style={styles.metricValue}>{activeRafflesCount}</span>
          </div>
          <span style={styles.metricLabel}>Sorteios Ativos</span>
        </div>

        {/* KPI 2: Cupons Emitidos */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(254, 107, 0, 0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>confirmation_number</span>
            </div>
            <span style={styles.metricValue}>{totalTicketsCount}</span>
          </div>
          <span style={styles.metricLabel}>Cupons em Urnas</span>
        </div>

        {/* KPI 3: Sorteios Concluídos */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(26, 115, 18, 0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>military_tech</span>
            </div>
            <span style={styles.metricValue}>{totalCompletedRaffles}</span>
          </div>
          <span style={styles.metricLabel}>Campanhas Concluídas</span>
        </div>

        {/* KPI 4: Último Ganhador */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(110, 0, 193, 0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>trophy</span>
            </div>
            <span style={{ ...styles.metricValue, fontSize: '18px', maxWidth: '75%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lastWinnerName}
            </span>
          </div>
          <span style={styles.metricLabel}>Último Sorteado</span>
        </div>

      </section>

      {/* Simulador de Embaralhamento Ativo */}
      {isDrawing && (
        <section style={styles.drawStatusCard}>
          <div style={styles.drawLoadingHeader}>
            <div style={styles.drawLoadingSpinner} />
            <h3 style={styles.drawLoadingTitle}>SORTEIO EM ANDAMENTO</h3>
          </div>
          <p style={styles.drawLoadingDesc}>{drawingStepText}</p>
          <div style={styles.drawProgressBarBg}>
            <div style={{ ...styles.drawProgressBarFill, width: `${drawingProgress}%` }} />
          </div>
          <span style={styles.drawProgressPct}>{drawingProgress}%</span>
        </section>
      )}

      {/* Split Grid: Criar Sorteio & Lista Ativa */}
      <div style={styles.splitGrid}>
        
        {/* Lado Esquerdo: Formulário de Criação */}
        <section style={styles.leftCard}>
          <h2 style={styles.cardTitle}>Lançar Novo Sorteio</h2>
          <p style={styles.cardSubtitle}>Defina o prêmio e as regras para gerar cupons automaticamente aos clientes qualificáveis.</p>
          
          <form onSubmit={handleCreateRaffle} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Título da Campanha Promocional</label>
              <input 
                type="text" 
                placeholder="Ex: Sorteio de Fim de Ano Tefé" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)}
                style={styles.formInput} 
                required 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Prêmio / Recompensa</label>
              <input 
                type="text" 
                placeholder="Ex: 1 Cesta de Natal com Produtos do Norte" 
                value={newPrize} 
                onChange={(e) => setNewPrize(e.target.value)}
                style={styles.formInput} 
                required 
              />
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Critério p/ Ganhar Cupom</label>
                <select 
                  value={newCriteria} 
                  onChange={(e) => setNewCriteria(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="Compras acima de R$ 30,00">Compras acima de R$ 30,00</option>
                  <option value="Compras acima de R$ 50,00">Compras acima de R$ 50,00</option>
                  <option value="Pagamento via Pix Offline">Pagamento via Pix Offline</option>
                  <option value="Livre para todos os seguidores">Livre para todos os seguidores</option>
                </select>
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Quantidade de Ganhadores</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5"
                  value={newWinnersCount} 
                  onChange={(e) => setNewWinnersCount(e.target.value)}
                  style={styles.formInput} 
                  required 
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Data de Apuração/Sorteio</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)}
                style={styles.formInput} 
              />
            </div>

            <button type="submit" style={styles.submitBtn}>
              Ativar Campanha de Sorteio
            </button>
          </form>
        </section>

        {/* Lado Direito: Campanhas de Sorteio Ativas */}
        <section style={styles.leftCard}>
          <h2 style={styles.cardTitle}>Sorteios Ativos e Agendados</h2>
          <p style={styles.cardSubtitle}>Gerencie as campanhas ativas e apure o resultado realizando o sorteio eletrônico.</p>
          
          <div style={styles.raffleList}>
            {raffles.map((raffle) => {
              const isActive = raffle.status === 'active';
              return (
                <div key={raffle.id} style={styles.raffleItem}>
                  <div style={styles.raffleMain}>
                    <div style={styles.raffleHeader}>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--on-surface)' }}>{raffle.title}</span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: isActive ? 'rgba(110, 0, 193, 0.08)' : 'rgba(126, 115, 134, 0.08)',
                        color: isActive ? 'var(--primary)' : 'var(--outline)'
                      }}>
                        {isActive ? '● Ativo na Vitrine' : '✓ Concluído'}
                      </span>
                    </div>
                    
                    <div style={styles.raffleDetailsGrid}>
                      <span style={styles.raffleDetailText}>🎁 <strong>Prêmio:</strong> {raffle.prize}</span>
                      <span style={styles.raffleDetailText}>🎟️ <strong>Cupons:</strong> {raffle.ticketsCount} cupons emitidos</span>
                      <span style={styles.raffleDetailText}>🎯 <strong>Critério:</strong> {raffle.criteria}</span>
                      <span style={styles.raffleDetailText}>📅 <strong>Data limite:</strong> {raffle.date}</span>
                    </div>
                  </div>

                  {isActive && (
                    <button 
                      onClick={() => triggerDraw(raffle.id)} 
                      disabled={isDrawing}
                      style={{
                        ...styles.drawBtn,
                        opacity: isDrawing ? 0.6 : 1
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>celebration</span>
                      <span>Realizar Sorteio</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Histórico Geral de Ganhadores (Verificar Ganhadores) */}
      <section style={styles.leftCard}>
        <h2 style={styles.cardTitle}>Verificar Ganhadores</h2>
        <p style={styles.cardSubtitle}>Consulte o histórico de apurações de sorteios e controle a entrega dos prêmios físicos aos clientes.</p>

        <div style={{ ...styles.tableWrapper, marginTop: '20px' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Cliente Sorteado</th>
                <th style={styles.th}>Nº Cupom</th>
                <th style={styles.th}>Campanha</th>
                <th style={styles.th}>Prêmio</th>
                <th style={styles.th}>Data Apuração</th>
                <th style={styles.th}>Entrega</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => {
                const isDelivered = w.status === 'delivered';
                return (
                  <tr key={w.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{w.name}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '700' }}>{w.ticket}</td>
                    <td style={styles.td}>{w.raffleTitle}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{w.prize}</td>
                    <td style={styles.td}>{w.date}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: isDelivered ? 'rgba(26, 115, 18, 0.08)' : 'rgba(254, 107, 0, 0.08)',
                        color: isDelivered ? 'var(--tertiary)' : 'var(--secondary)'
                      }}>
                        {isDelivered ? 'Entregue' : 'Aguardando Retirada'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        onClick={() => toggleWinnerStatus(w.id)}
                        style={{
                          ...styles.actionToggleBtn,
                          backgroundColor: isDelivered ? 'rgba(254, 107, 0, 0.08)' : 'rgba(26, 115, 18, 0.08)',
                          color: isDelivered ? 'var(--secondary)' : 'var(--tertiary)'
                        }}
                      >
                        {isDelivered ? 'Marcar Pendente' : 'Confirmar Entrega'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confetti / Golden Certificate Winner Popup */}
      {showConfettiPopup && drawnWinner && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <div style={styles.popupCrown}>👑</div>
            <h2 style={styles.popupTitle}>PARABÉNS AO SORTEADO!</h2>
            <p style={styles.popupSubtitle}>Apuração auditável realizada com sucesso</p>
            
            <div style={styles.certificateCard}>
              <span style={styles.certLabel}>CERTIFICADO DE GANHADOR UÁRI</span>
              <div style={styles.certName}>{drawnWinner.name}</div>
              <div style={styles.certTicket}>CUPOM PREMIADO: <strong style={{ color: 'var(--primary)' }}>{drawnWinner.ticket}</strong></div>
              <div style={styles.certPrize}>🏆 Prêmio: <strong>{drawnWinner.prize}</strong></div>
              <div style={styles.certDetails}>Sorteio: {drawnWinner.raffleTitle} | Tefé - Amazonas</div>
            </div>

            <button onClick={() => setShowConfettiPopup(false)} style={styles.popupCloseBtn}>
              Fechar e Salvar no Histórico
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos premium baseados no design system e bento layout das páginas do UÁRI Lojista
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '8px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  metricIconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--on-surface)',
  },
  metricLabel: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    alignItems: 'start',
  },
  leftCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '8px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    padding: '24px',
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
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--on-surface)',
  },
  formInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
  },
  formSelect: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: 'var(--on-surface)',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  },
  raffleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  raffleItem: {
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'var(--surface-container-low)',
  },
  raffleMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  raffleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  raffleDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  raffleDetailText: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
  },
  drawBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'var(--secondary-container)', // Laranja #fe6b00
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
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
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--outline)',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid var(--surface-container-highest)',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--on-surface)',
  },
  actionToggleBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  drawStatusCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    border: '2px dashed var(--primary)',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  drawLoadingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  drawLoadingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(110, 0, 193, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  drawLoadingTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '0.05em',
  },
  drawLoadingDesc: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  drawProgressBarBg: {
    width: '100%',
    maxWidth: '500px',
    height: '10px',
    backgroundColor: 'var(--surface-container)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  drawProgressBarFill: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '6px',
    transition: 'width 0.1s linear',
  },
  drawProgressPct: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
  },
  popupCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0px 10px 40px rgba(110, 0, 193, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    border: '1px solid rgba(110, 0, 193, 0.08)',
  },
  popupCrown: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  popupTitle: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--secondary)', // Laranja escuro / cobre
    letterSpacing: '0.02em',
  },
  popupSubtitle: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    marginBottom: '24px',
  },
  certificateCard: {
    width: '100%',
    backgroundColor: '#fffdf5', // Fundo bege claro Figma
    border: '2px solid rgba(254, 107, 0, 0.15)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
    boxShadow: 'inset 0 0 20px rgba(254, 107, 0, 0.02)',
  },
  certLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--secondary)',
    letterSpacing: '0.1em',
  },
  certName: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  certTicket: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
  },
  certPrize: {
    fontSize: '16px',
    color: 'var(--on-surface)',
    borderTop: '1px dashed var(--outline-variant)',
    borderBottom: '1px dashed var(--outline-variant)',
    padding: '8px 0',
  },
  certDetails: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
  },
  popupCloseBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
