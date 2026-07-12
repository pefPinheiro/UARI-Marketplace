'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'store' | 'admin';
  registeredAt: string;
  status: 'active' | 'suspended';
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'client' | 'store' | 'admin'>('client');
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Buscar Usuários da tabela do Supabase no Carregamento
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at,
          stores (
            id,
            name,
            subscription_status,
            is_verified
          )
        `);

      if (error) throw error;

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: PlatformUser[] = data.map((item: any) => {
          const store = Array.isArray(item.stores) ? item.stores[0] : item.stores;
          const isSuspended = store?.subscription_status === 'inactive';
          
          return {
            id: item.id,
            name: item.full_name || 'Usuário Sem Nome',
            email: item.email,
            role: item.role === 'user' ? 'client' : item.role,
            registeredAt: new Date(item.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            status: isSuspended ? 'suspended' : 'active'
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários do Supabase:', err);
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;

      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      const subscriptionStatus = nextStatus === 'suspended' ? 'inactive' : 'active';

      // Se for um ID de banco real (não mock)
      if (!id.startsWith('u')) {
        if (user.role === 'store') {
          // Buscar a loja correspondente ao lojista
          const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', id)
            .maybeSingle();

          if (storeData?.id) {
            const { error } = await supabase
              .from('stores')
              .update({ subscription_status: subscriptionStatus })
              .eq('id', storeData.id);

            if (error) {
              console.error('Erro ao atualizar status da loja no Supabase:', error);
            }
          }
        }
      }

      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      alert(`O status de acesso do usuário "${user.name}" foi alterado para ${nextStatus === 'active' ? 'Ativo' : 'Suspenso'}!`);
    } catch (err) {
      console.error('Erro ao alternar status do usuário:', err);
    }
  };

  const handleEditRole = (id: string, current: 'client' | 'store' | 'admin') => {
    setActiveUserId(id);
    setNewRole(current);
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserId) return;

    const user = users.find(u => u.id === activeUserId);
    if (!user) return;

    try {
      // Se for um ID de banco real, atualiza no Supabase
      if (!activeUserId.startsWith('u')) {
        const dbRole = newRole === 'client' ? 'user' : newRole;
        const { error } = await supabase
          .from('profiles')
          .update({ role: dbRole })
          .eq('id', activeUserId);

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => u.id === activeUserId ? { ...u, role: newRole } : u));
      setShowRoleModal(false);
      setActiveUserId(null);
      alert('Nível de permissão (Role) atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
      alert('Erro ao atualizar permissão no Supabase.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return 'Cliente/Consumidor';
      case 'store': return 'Lojista/Parceiro';
      case 'admin': return 'Administrador';
      default: return role;
    }
  };

  // Contadores com base em dados reais
  const totalUsers = users.length;
  const clientsCount = users.filter(u => u.role === 'client').length;
  const storesCount = users.filter(u => u.role === 'store').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Controle de Usuários Master</h1>
          <p style={styles.pageSubtitle}>Gerencie permissões cadastrais, níveis de acesso administrativos e bloqueie acessos indevidos.</p>
        </div>
      </section>

      {/* Bento Grid KPIs */}
      <section style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total de Cadastros</span>
          <div style={styles.metricValue}>{totalUsers}</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Clientes</span>
          <div style={{ ...styles.metricValue, color: 'var(--primary)' }}>{clientsCount}</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Parceiros Lojistas</span>
          <div style={{ ...styles.metricValue, color: 'var(--secondary)' }}>{storesCount}</div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Super Administradores</span>
          <div style={{ ...styles.metricValue, color: 'var(--tertiary)' }}>{adminsCount}</div>
        </div>
      </section>

      {/* Users Table Card */}
      <section style={styles.card}>
        <h3 style={styles.cardTitle}>Usuários e Níveis de Acesso</h3>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Nome Completo</th>
                <th style={styles.th}>E-mail</th>
                <th style={styles.th}>Nível de Acesso (Role)</th>
                <th style={styles.th}>Data de Cadastro</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isActive = u.status === 'active';
                return (
                  <tr key={u.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    
                    {/* Role editável */}
                    <td style={styles.td}>
                      <div style={styles.roleWrapper} onClick={() => handleEditRole(u.id, u.role)}>
                        <span style={{ fontWeight: '750' }}>{getRoleLabel(u.role)}</span>
                        <span className="material-symbols-outlined" style={styles.editIcon}>edit</span>
                      </div>
                    </td>

                    <td style={styles.td}>{u.registeredAt}</td>

                    {/* Status */}
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: isActive ? 'rgba(26, 115, 18, 0.08)' : 'rgba(186, 26, 26, 0.08)',
                        color: isActive ? 'var(--tertiary)' : 'var(--error)'
                      }}>
                        ● {isActive ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        onClick={() => toggleUserStatus(u.id)}
                        style={{
                          ...styles.statusToggleBtn,
                          backgroundColor: isActive ? 'rgba(186, 26, 26, 0.08)' : 'rgba(26, 115, 18, 0.08)',
                          color: isActive ? 'var(--error)' : 'var(--tertiary)'
                        }}
                      >
                        {isActive ? 'Desativar' : 'Reativar'}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Editar Role */}
      {showRoleModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Alterar Nível de Acesso</h3>
            <p style={styles.modalDesc}>Modifique o tipo de permissões de sistema concedidas a este cadastro.</p>
            
            <form onSubmit={handleSaveRole} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.formLabel}>Selecione o Cargo/Acesso</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value as 'client' | 'store' | 'admin')}
                  style={styles.selectInput}
                >
                  <option value="client">Cliente / Consumidor</option>
                  <option value="store">Lojista / Parceiro Comercial</option>
                  <option value="admin">Administrador Master</option>
                </select>
              </div>
              
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>Conceder Cargo</button>
                <button type="button" onClick={() => setShowRoleModal(false)} style={styles.cancelBtn}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos UÁRI Admin
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
    color: 'var(--on-surface)',
  },
  card: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    marginBottom: '20px',
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
    fontSize: '12px',
    fontWeight: '800',
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
  roleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    color: 'var(--primary)',
    fontWeight: '750',
  },
  editIcon: {
    fontSize: '14px',
    color: 'var(--outline)',
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
  statusToggleBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '750',
    cursor: 'pointer',
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
    maxWidth: '400px',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
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
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--outline)',
  },
  selectInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: 'var(--on-surface)',
    fontWeight: '600',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '750',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '750',
    cursor: 'pointer',
  }
};
