'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { lojistaService } from '../services/lojista';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LojistaContextType {
  user: any;
  store: any;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const LojistaContext = createContext<LojistaContextType | undefined>(undefined);

export function useLojista() {
  const context = useContext(LojistaContext);
  if (!context) {
    throw new Error('useLojista deve ser usado dentro de um LojistaProvider');
  }
  return context;
}

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // States para Formulários de Auth
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // State para Criar Loja (se logado sem loja)
  const [newStoreName, setNewStoreName] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);

  useEffect(() => {
    // 1. Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadLojistaStore(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadLojistaStore(session.user.id, session.user);
      } else {
        setStore(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadLojistaStore(userId: string, currentUser?: any) {
    try {
      setAuthError('');
      // Autocorreção: Verifica se o perfil existe em public.profiles para evitar erros 409
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (profileErr && profileErr.code === 'PGRST116') {
        const emailVal = currentUser?.email || 'lojista@uamail.com';
        const nameVal = currentUser?.user_metadata?.full_name || 'Lojista UÁRI';
        
        // Tenta auto-inserir o perfil dele
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: emailVal,
            full_name: nameVal,
            role: 'store'
          });

        if (insErr) {
          console.error("Erro RLS ao auto-inserir perfil:", insErr);
          setAuthError(
            'Seu perfil de banco de dados não foi encontrado. Para destravar a sua conta de testes instantaneamente, execute o script abaixo no SQL Editor do seu Supabase Console:\n\n' +
            `INSERT INTO public.profiles (id, email, full_name, role) VALUES ('${userId}', '${emailVal}', '${nameVal}', 'store') ON CONFLICT (id) DO UPDATE SET role = 'store';`
          );
        }
      }

      const activeStore = await lojistaService.fetchStoreByOwner(userId);
      setStore(activeStore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadLojistaStore(user.id, user);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (!nome || !storeName || !email || !confirmEmail || !senha || !confirmSenha) {
        setAuthError('Preencha todos os campos!');
        return;
      }
      if (email.trim() !== confirmEmail.trim()) {
        setAuthError('Os e-mails informados não coincidem!');
        return;
      }
      if (senha !== confirmSenha) {
        setAuthError('As senhas informadas não coincidem!');
        return;
      }
    } else {
      if (!email || !senha) {
        setAuthError('Preencha todos os campos!');
        return;
      }
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (isRegistering) {
        // Registra o Lojista no Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: {
              full_name: nome || 'Lojista Tefé',
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Cria a loja dele na mesma hora
          await lojistaService.createDemoStore(
            data.user.id,
            storeName || `Loja de ${nome || 'Lojista'}`
          );
          alert('Conta de lojista cadastrada com sucesso!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro de autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName) return;
    setCreatingStore(true);
    setAuthError('');
    try {
      // 1. Garantir que o perfil do usuário exista antes de cadastrar a loja (evita erro de chave estrangeira 409)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Lojista UÁRI',
            role: 'store'
          });

        if (insErr) {
          throw new Error(
            'Seu perfil de banco de dados não foi encontrado. Para liberar a criação de lojas, execute no SQL Editor do Supabase:\n\n' +
            `INSERT INTO public.profiles (id, email, full_name, role) VALUES ('${user.id}', '${user.email}', '${user.user_metadata?.full_name || 'Lojista UÁRI'}', 'store') ON CONFLICT (id) DO UPDATE SET role = 'store';`
          );
        }
      } else if (profile.role !== 'store' && profile.role !== 'admin') {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ role: 'store' })
          .eq('id', user.id);

        if (upErr) {
          throw new Error('Não foi possível conceder privilégios de lojista ao seu perfil.');
        }
      }

      const activeStore = await lojistaService.createDemoStore(user.id, newStoreName);
      if (activeStore) {
        setStore(activeStore);
        alert('Sua loja foi criada e ativada com sucesso! Bem-vindo.');
      } else {
        alert('Falha ao criar loja.');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Erro ao criar loja.');
      alert('Falha ao criar loja. Verifique o aviso no painel.');
    } finally {
      setCreatingStore(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  // 1. Carregamento Inicial
  if (loading) {
    return (
      <div style={styles.fullscreenCenter}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Conectando ao ecossistema UÁRI...</p>
      </div>
    );
  }

  // 2. Tela de Login e Cadastro Premium Figma/Web
  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.logoCardContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="UÁRI Logo" style={{ height: '70px', width: 'auto', marginBottom: '16px' }} />
          </div>

          <h2 style={styles.authTitle}>
            {isRegistering ? 'Portal do Lojista: Criar Conta' : 'Portal de Vendas: Lojista'}
          </h2>
          <p style={styles.authSubtitle}>
            {isRegistering 
              ? 'Cadastre seu negócio e aproveite a vitrine de luxo de Tefé-AM.'
              : 'Gerencie sua carteira, splits, escrow e campanhas promocionais.'}
          </p>

          {authError && (
            <div style={styles.errorBox}>
              <span>⚠️ {authError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={styles.authForm}>
            {isRegistering && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Seu Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: João da Castanha" 
                    style={styles.formInput}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nome da sua Loja/Marca</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Castanha & Cia" 
                    style={styles.formInput}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>E-mail Corporativo</label>
              <input 
                type="email" 
                placeholder="exemplo@uamail.com" 
                style={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isRegistering && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Confirmar E-mail</label>
                <input 
                  type="email" 
                  placeholder="Repita o e-mail informado" 
                  style={styles.formInput}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Senha de Acesso</label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                style={styles.formInput}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {isRegistering && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Confirmar Senha</label>
                <input 
                  type="password" 
                  placeholder="Repita a senha de acesso" 
                  style={styles.formInput}
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" style={styles.authBtn} disabled={authLoading}>
              {authLoading ? 'Processando...' : isRegistering ? 'Cadastrar e Ativar Loja' : 'Entrar no Painel'}
            </button>
          </form>

          <button 
            onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
            style={styles.toggleAuthBtn}
          >
            {isRegistering 
              ? 'Já tem uma loja ativa? Entrar aqui' 
              : 'Não possui cadastro? Crie sua loja UÁRI'}
          </button>
        </div>
      </div>
    );
  }

  // 3. Se Logado, mas NÃO tem loja associada (caso de admin ou usuário padrão que logou)
  if (!store) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.logoCardContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="UÁRI Logo" style={{ height: '70px', width: 'auto', marginBottom: '16px' }} />
          </div>

          <h2 style={styles.authTitle}>Ative seu Painel de Vendas</h2>
          <p style={styles.authSubtitle}>
            Identificamos sua conta `{user.email}`, mas você ainda não possui uma loja cadastrada. Crie uma agora em 1 clique para testar!
          </p>

          <form onSubmit={handleCreateStore} style={styles.authForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome da sua Loja</label>
              <input 
                type="text" 
                placeholder="Ex: Castanha & Cia" 
                style={styles.formInput}
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={styles.authBtn} disabled={creatingStore}>
              {creatingStore ? 'Criando...' : 'Ativar Minha Loja UÁRI 🚀'}
            </button>
          </form>

          <button onClick={handleLogout} style={styles.toggleAuthBtn}>
            Voltar / Entrar com outra conta
          </button>
        </div>
      </div>
    );
  }

  // 4. Painel Completo Integrado com Sidebar Premium Figma/Web
  return (
    <LojistaContext.Provider value={{ user, store, loading, refreshData }}>
      <div style={styles.dashboardShell}>
        {/* Sidebar Esquerda Premium */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logoIconBg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="UÁRI" style={{ height: '24px', width: 'auto' }} />
            </div>
            <div style={styles.sidebarLogoTextContainer}>
              <span style={styles.sidebarLogoText}>UÁRI Lojista</span>
              <span style={styles.sidebarLogoSub}>Quebra essa castanha</span>
            </div>
          </div>

          <nav style={styles.navMenu}>
            <Link href="/" style={{
              ...styles.navLink,
              ...(pathname === '/' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>

            <Link href="/produtos" style={{
              ...styles.navLink,
              ...(pathname === '/produtos' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Meu Catálogo</span>
            </Link>



            <Link href="/cupons" style={{
              ...styles.navLink,
              ...(pathname === '/cupons' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">sell</span>
              <span>Promoções</span>
            </Link>

            <Link href="/financeiro" style={{
              ...styles.navLink,
              ...(pathname === '/financeiro' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">payments</span>
              <span>Financeiro & Planos</span>
            </Link>

            <Link href="/gamificacao" style={{
              ...styles.navLink,
              ...(pathname === '/gamificacao' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">emoji_events</span>
              <span>Gamificação & Sorteios</span>
            </Link>

            <Link href="/chat" style={{
              ...styles.navLink,
              ...(pathname === '/chat' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">chat</span>
              <span>Atendimento & Chat</span>
            </Link>

            <Link href="/configuracoes" style={{
              ...styles.navLink,
              ...(pathname === '/configuracoes' ? styles.navLinkActive : {})
            }}>
              <span className="material-symbols-outlined">settings</span>
              <span>Configurações</span>
            </Link>
          </nav>

          {/* Footer do Lojista na Sidebar com botão Central de Ajuda */}
          <div style={styles.sidebarFooter}>
            <button onClick={() => alert('Central de Ajuda UÁRI: Suporte pelo WhatsApp da plataforma.')} style={styles.helpBtn}>
              Central de Ajuda
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sair da Conta
            </button>
          </div>
        </aside>

        {/* Corpo Direito do Dashboard */}
        <div style={styles.mainContent}>
          {/* Header Superior Figma */}
          <header style={styles.topHeader}>
            <div style={styles.headerLeft}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5UXeaQFyLCuSznau1ulLXHeH_athshwtX5UTuP05zUF02mcsR-XTdBQx0UD6DmWFJQJTp6LvCAtJkQp-AxtZe8pd_RmY7CKf-fMAd3sGwwcTxmia3tPNPuCQTUEgkX3NVHMa4pWCrmCLIwoKpM63FHdyFJnLoU-6Q5QZXRzppC_rv8Hxms6bCGZKAeCbu0RCAB02UWS7TtNiVo4pu7yNvE6VW7SxWueKB-tPh78I6_t6WOT3aSYVATSauewMzf1JTtt8l1ExGerI4" 
                alt="UÁRI Logo" 
                style={styles.headerLogo} 
              />
            </div>

            <div style={styles.headerRight}>
              <button 
                onClick={() => alert('Solicitação enviada! Nossa equipe de curadores entrará em contato para cadastrar seu novo produto.')} 
                style={styles.headerRequestBtn}
              >
                Solicitar Cadastro de Produto
              </button>

              {/* Notificação Bell com Bolinha */}
              <div style={styles.notificationWrapper}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
                <span style={styles.notificationDot} />
              </div>

              {/* Perfil do Vendedor com borda esquerda */}
              <div style={styles.userProfileMeta}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--on-surface-variant)' }}>account_circle</span>
                <div style={styles.userProfileText}>
                  <span style={styles.userProfileName}>{store?.name || 'Empório do Norte'}</span>
                  <span style={styles.userProfileBadge}>Vendedor Premium</span>
                </div>
              </div>
            </div>
          </header>

          {/* Renderização das sub-páginas do NextJS */}
          <main style={styles.pageWrapper}>
            {children}
          </main>
        </div>
      </div>
    </LojistaContext.Provider>
  );
}

// Estilos Premium via JS Objects (Equivalente a CSS modules premium)
const styles: { [key: string]: React.CSSProperties } = {
  fullscreenCenter: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(106, 27, 154, 0.1)',
    borderTop: '4px solid #6A1B9A',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#3E2723',
    fontWeight: 600,
    fontSize: '15px',
  },
  authContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: '20px',
  },
  authCard: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(62, 39, 35, 0.04)',
    border: '1px solid rgba(62, 39, 35, 0.04)',
    textAlign: 'center',
  },
  logoCardContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24px',
  },
  logoEmoji: {
    fontSize: '32px',
    marginRight: '8px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    color: '#3E2723',
    letterSpacing: '0.5px',
  },
  authTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#3E2723',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: '8px',
  },
  authSubtitle: {
    fontSize: '14px',
    color: '#757575',
    lineHeight: '20px',
    marginBottom: '28px',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    border: '1px solid #FFCDD2',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '20px',
    color: '#D32F2F',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 600,
  },
  authForm: {
    textAlign: 'left',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#3E2723',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(62, 39, 35, 0.1)',
    fontSize: '14px',
    color: '#3E2723',
    backgroundColor: '#FAF9F9',
    outline: 'none',
  },
  authBtn: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#FF6D00', // Laranja Ação
    color: '#ffffff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 4px 14px rgba(255, 109, 0, 0.2)',
  },
  toggleAuthBtn: {
    background: 'none',
    border: 'none',
    color: '#6A1B9A',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '20px',
  },
  dashboardShell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-subtle-yellow)',
  },
  sidebar: {
    width: '256px',
    height: '100vh',
    backgroundColor: 'var(--surface-container-low)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    color: 'var(--on-surface)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '32px',
    paddingLeft: '8px',
    paddingRight: '8px',
    gap: '12px',
  },
  logoIconBg: {
    width: '40px',
    height: '40px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  sidebarLogoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarLogoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  sidebarLogoSub: {
    fontSize: '12px',
    fontStyle: 'italic',
    color: 'var(--on-surface-variant)',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    gap: '12px',
  },
  navLinkActive: {
    backgroundColor: '#8a2be2', // primary-container!
    color: '#eed9ff', // on-primary-container!
    fontWeight: '700',
  },
  sidebarFooter: {
    marginTop: 'auto',
    backgroundColor: 'var(--surface-container)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  helpBtn: {
    width: '100%',
    padding: '8px 16px',
    backgroundColor: 'var(--primary)', // #6e00c1
    color: 'var(--on-primary)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'opacity 0.2s',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--on-surface-variant)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '4px 0',
    textDecoration: 'underline',
  },
  mainContent: {
    flex: 1,
    marginLeft: '256px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-subtle-yellow)',
  },
  topHeader: {
    height: '80px',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--outline-variant)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '20px',
    paddingRight: '20px',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerLogo: {
    height: '48px',
    width: 'auto',
  },
  headerRequestBtn: {
    backgroundColor: 'var(--secondary-container)', // #fe6b00
    color: 'var(--on-secondary-container)', // #572000
    border: 'none',
    borderRadius: '9999px', // pill-shaped!
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.15s ease',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  notificationWrapper: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
  },
  notificationDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--error)',
    borderRadius: '50%',
  },
  userProfileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingLeft: '16px',
    borderLeft: '1px solid var(--outline-variant)',
  },
  userProfileText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userProfileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface)',
    lineHeight: '1.2',
  },
  userProfileBadge: {
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
  },
  pageWrapper: {
    flex: 1,
    padding: '16px',
    backgroundColor: 'var(--bg-subtle-yellow)',
  },
};
