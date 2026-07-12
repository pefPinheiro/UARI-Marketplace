'use client';

import React, { useState } from 'react';

export default function MasterConfigPage() {
  const [appName, setAppName] = useState('UÁRI Marketplace');
  const [supportPhone, setSupportPhone] = useState('+55 (97) 99123-4567');
  const [contactEmail, setContactEmail] = useState('contato@uarimarketplace.com.br');
  const [systemVersion, setSystemVersion] = useState('1.2.0');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert('⚙️ Configurações do Sistema salvas com sucesso em produção na nuvem!');
    }, 1000);
  };

  const handleDiscard = () => {
    setAppName('UÁRI Marketplace');
    setSupportPhone('+55 (97) 99123-4567');
    setContactEmail('contato@uarimarketplace.com.br');
    setSystemVersion('1.2.0');
    setMaintenanceMode(false);
    alert('Alterações descartadas!');
  };

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Configurações Master</h1>
          <p style={styles.pageSubtitle}>Ajuste as configurações do sistema UÁRI, contatos de suporte de Tefé e gerencie o status do servidor.</p>
        </div>
      </section>

      <form onSubmit={handleSave} style={styles.formLayout}>
        
        {/* Lado Esquerdo: Configurações do Sistema */}
        <div style={styles.leftColumn}>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>settings_applications</span>
              <h2 style={styles.cardTitle}>Configurações do Sistema</h2>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome da Plataforma</label>
              <input 
                type="text" 
                value={appName} 
                onChange={(e) => setAppName(e.target.value)}
                style={styles.formInput} 
                required 
              />
              <span style={styles.helpText}>Nome principal da marca exibido nas lojas e aplicativo do cliente.</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>WhatsApp de Suporte Oficial (Tefé)</label>
              <input 
                type="text" 
                value={supportPhone} 
                onChange={(e) => setSupportPhone(e.target.value)}
                style={styles.formInput} 
                required 
              />
              <span style={styles.helpText}>Canal oficial de suporte regional para incidentes e suporte técnico a lojistas.</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>E-mail de Contato Administrativo</label>
              <input 
                type="email" 
                value={contactEmail} 
                onChange={(e) => setContactEmail(e.target.value)}
                style={styles.formInput} 
                required 
              />
              <span style={styles.helpText}>E-mail principal para contato oficial, notificações e comunicações gerais.</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Versão Atual da Plataforma</label>
              <input 
                type="text" 
                value={systemVersion} 
                onChange={(e) => setSystemVersion(e.target.value)}
                style={styles.formInput} 
                required 
              />
              <span style={styles.helpText}>Tag de versão de lançamento do sistema UÁRI Marketplace.</span>
            </div>

          </div>

        </div>

        {/* Lado Direito: Servidor e Segurança */}
        <div style={styles.rightColumn}>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>dns</span>
              <h2 style={styles.cardTitle}>Servidor e Segurança</h2>
            </div>

            {/* Modo Manutenção toggle switch */}
            <div style={styles.toggleRowCard}>
              <div style={styles.toggleText}>
                <span style={styles.toggleTitle}>Modo de Manutenção Global</span>
                <span style={styles.toggleDesc}>Suspende acessos ao aplicativo móvel e painel de lojista para atualizações.</span>
              </div>
              
              <div style={styles.toggleActionWrapper} onClick={() => setMaintenanceMode(!maintenanceMode)}>
                <span style={{
                  ...styles.toggleLabelText,
                  color: maintenanceMode ? 'var(--error)' : 'var(--tertiary)'
                }}>
                  {maintenanceMode ? 'Ativo' : 'Inativo'}
                </span>
                <div style={{
                  ...styles.toggleSwitchBg,
                  backgroundColor: maintenanceMode ? 'var(--error)' : 'var(--outline-variant)'
                }}>
                  <div style={{
                    ...styles.toggleSwitchCircle,
                    transform: maintenanceMode ? 'translateX(20px)' : 'translateX(0px)'
                  }} />
                </div>
              </div>

            </div>

            {/* Backup settings info */}
            <div style={styles.backupBox}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>cloud_done</span>
              <div>
                <span style={{ fontWeight: '750', fontSize: '13px', display: 'block' }}>Backup Automático Ativo</span>
                <span style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '600' }}>Último backup salvo há 42 minutos.</span>
              </div>
            </div>

          </div>

        </div>

      </form>

      {/* Footer Actions */}
      <footer style={styles.footerRow}>
        <button type="button" onClick={handleDiscard} style={styles.discardBtn}>Descartar</button>
        <button 
          onClick={handleSave} 
          style={styles.saveBtn}
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </footer>

    </div>
  );
}

// Estilos UÁRI Admin
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px',
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
  },
  pageSubtitle: {
    fontSize: '15px',
    color: 'var(--on-surface-variant)',
  },
  formLayout: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
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
    gap: '20px',
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
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  formInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  prefix: {
    position: 'absolute',
    left: '12px',
    fontWeight: '750',
    color: 'var(--outline)',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  suffix: {
    position: 'absolute',
    right: '12px',
    fontWeight: '750',
    color: 'var(--outline)',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  helpText: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
    lineHeight: '15px',
  },
  toggleRowCard: {
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--surface-container-low)',
  },
  toggleText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '70%',
  },
  toggleTitle: {
    fontSize: '14px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  toggleDesc: {
    fontSize: '11px',
    color: 'var(--outline)',
    lineHeight: '14px',
    fontWeight: '600',
  },
  toggleActionWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  toggleLabelText: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
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
  },
  backupBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(110, 0, 193, 0.04)',
    border: '1px dashed var(--primary)',
    borderRadius: '8px',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '24px',
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid var(--surface-container-highest)',
  },
  discardBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--outline)',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'Plus Jakarta Sans',
    padding: '10px 20px',
  },
  saveBtn: {
    backgroundColor: 'var(--secondary-container)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '14px 42px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(254, 107, 0, 0.15)',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans',
  }
};
