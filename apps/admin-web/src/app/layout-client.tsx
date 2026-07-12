'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={styles.dashboardShell}>
      {/* Sidebar Esquerda UÁRI Admin */}
      <aside style={styles.sidebar}>
        
        {/* Sidebar Header logo */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logoIconBg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5UXeaQFyLCuSznau1ulLXHeH_athshwtX5UTuP05zUF02mcsR-XTdBQx0UD6DmWFJQJTp6LvCAtJkQp-AxtZe8pd_RmY7CKf-fMAd3sGwwcTxmia3tPNPuCQTUEgkX3NVHMa4pWCrmCLIwoKpM63FHdyFJnLoU-6Q5QZXRzppC_rv8Hxms6bCGZKAeCbu0RCAB02UWS7TtNiVo4pu7yNvE6VW7SxWueKB-tPh78I6_t6WOT3aSYVATSauewMzf1JTtt8l1ExGerI4" alt="UÁRI" style={{ height: '24px', width: 'auto' }} />
          </div>
          <div style={styles.sidebarLogoTextContainer}>
            <span style={styles.sidebarLogoText}>UÁRI Admin</span>
            <span style={styles.sidebarLogoSub}>Marketplace de Tefé</span>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <nav style={styles.navMenu}>
          
          <Link href="/" style={{
            ...styles.navLink,
            ...(pathname === '/' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>

          <Link href="/lojistas" style={{
            ...styles.navLink,
            ...(pathname === '/lojistas' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">storefront</span>
            <span>Lojistas</span>
          </Link>

          <Link href="/usuarios" style={{
            ...styles.navLink,
            ...(pathname === '/usuarios' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">group</span>
            <span>Usuários</span>
          </Link>

          <Link href="/curadoria" style={{
            ...styles.navLink,
            ...(pathname === '/curadoria' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">verified</span>
            <span>Curadoria de Produtos</span>
          </Link>

          <Link href="/promocoes" style={{
            ...styles.navLink,
            ...(pathname === '/promocoes' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">campaign</span>
            <span>Campanhas de Desconto</span>
          </Link>

          <Link href="/financeiro" style={{
            ...styles.navLink,
            ...(pathname === '/financeiro' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">payments</span>
            <span>Financeiro</span>
          </Link>

          <Link href="/sorteios-gamificacao" style={{
            ...styles.navLink,
            ...(pathname === '/sorteios-gamificacao' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">emoji_events</span>
            <span>Sorteios & Gamificação</span>
          </Link>

          <Link href="/configuracoes" style={{
            ...styles.navLink,
            ...(pathname === '/configuracoes' ? styles.navLinkActive : {})
          }}>
            <span className="material-symbols-outlined">settings</span>
            <span>Configurações Master</span>
          </Link>
          
        </nav>

        {/* Bottom Sidebar Action area */}
        <div style={styles.sidebarFooter}>
          <Link href="#" onClick={() => alert('Suporte Master: Canal de contato com engenharia e suporte regional.')} style={styles.footerLink}>
            <span className="material-symbols-outlined">help</span>
            <span>Suporte</span>
          </Link>

          <Link href="#" onClick={() => alert('Logout efetuado com sucesso!')} style={styles.footerLink}>
            <span className="material-symbols-outlined">logout</span>
            <span>Sair</span>
          </Link>
        </div>

      </aside>

      {/* Corpo Direito do Painel */}
      <div style={styles.mainContent}>
        
        {/* Header Superior Master */}
        <header style={styles.topHeader}>
          
          {/* Search Bar */}
          <div style={styles.searchWrapper}>
            <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
            <input 
              type="text" 
              placeholder="Pesquisar em toda a plataforma..." 
              style={styles.searchInput} 
            />
          </div>

          {/* Header Right Widgets */}
          <div style={styles.headerRight}>
            
            {/* Notification Bell */}
            <div style={styles.iconBadgeWrapper} onClick={() => alert('Você possui 5 saques pendentes de apuração financeira.')}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--on-surface-variant)' }}>notifications</span>
              <span style={styles.notificationDot} />
            </div>

            {/* Email Icon */}
            <div style={styles.iconWrapper} onClick={() => alert('Nenhuma mensagem não lida na caixa administrativa.')}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--on-surface-variant)' }}>mail</span>
            </div>

            {/* Settings Cog */}
            <div style={styles.iconWrapper} onClick={() => alert('Configurações rápidas de servidor ativas.')}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--on-surface-variant)' }}>settings</span>
            </div>

            {/* Profile area */}
            <div style={styles.profileBox}>
              <div style={styles.profileTexts}>
                <span style={styles.profileName}>Admin Master</span>
                <span style={styles.profileBadge}>SUPER USUÁRIO</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
                alt="Admin Avatar" 
                style={styles.avatarBig} 
              />
            </div>

          </div>
        </header>

        {/* Sub-página Renderizada */}
        <main style={styles.pageWrapper}>
          {children}
        </main>

      </div>
    </div>
  );
}

// Estilos premium inline idênticos à paleta e layouts Figma fornecidos
const styles: { [key: string]: React.CSSProperties } = {
  dashboardShell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--surface)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--surface-container-lowest)',
    borderRight: '1px solid var(--surface-container-highest)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    padding: '24px 16px',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  logoIconBg: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sidebarLogoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  sidebarLogoText: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--primary)',
    fontFamily: 'Plus Jakarta Sans',
    letterSpacing: '-0.02em',
  },
  sidebarLogoSub: {
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--on-surface-variant)',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'Plus Jakarta Sans',
    transition: 'all 0.2s ease-in-out',
  },
  navLinkActive: {
    backgroundColor: 'rgba(26, 115, 18, 0.08)', // Fundo verde-esmeralda figma
    color: 'var(--tertiary)', // Verde escuro tucumã
  },
  sidebarFooter: {
    borderTop: '1px solid var(--surface-container-highest)',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  newReportBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--primary)', // Roxo Figma #6e00c1
    color: '#ffffff',
    border: 'none',
    borderRadius: '24px', // Cápsula
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'Plus Jakarta Sans',
    boxShadow: '0 4px 12px rgba(110, 0, 193, 0.1)',
    transition: 'all 0.2s',
    marginBottom: '8px',
  },
  footerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
    transition: 'all 0.2s',
  },
  mainContent: {
    flex: 1,
    paddingLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  topHeader: {
    height: '70px',
    backgroundColor: 'var(--surface-container-lowest)',
    borderBottom: '1px solid var(--surface-container-highest)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 999,
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '320px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--outline)',
    fontSize: '20px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 42px',
    borderRadius: '9999px', // Borda oval rounded-full do Figma
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-low)',
    color: 'var(--on-surface)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    transition: 'all 0.2s',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  iconBadgeWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'opacity 0.2s',
  },
  notificationDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--error)',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '1px solid var(--surface-container-highest)',
    paddingLeft: '20px',
  },
  profileTexts: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1px',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
  },
  profileBadge: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--tertiary)', // Verde esmeralda super usuário
    letterSpacing: '0.05em',
  },
  avatarBig: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  pageWrapper: {
    padding: '32px',
    flex: 1,
    overflowY: 'auto',
  }
};
