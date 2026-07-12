'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PlatformCampaign {
  id: string;
  code: string;
  realCode: string;
  discountPercent: number;
  category: string;
  expiresAt: string;
  createdAt: string;
}

export default function PromocoesAdminPage() {
  const [campaigns, setCampaigns] = useState<PlatformCampaign[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('15');
  const [category, setCategory] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('created_by', 'admin')
        .is('store_id', null);

      if (error) throw error;

      if (data) {
        // Filtra e decodifica as campanhas com prefixo CAMP#
        const mapped: PlatformCampaign[] = data
          .filter((item: any) => item.code.startsWith('CAMP#'))
          .map((item: any) => {
            const parts = item.code.split('#');
            const realCode = parts[1] || item.code;
            const cat = parts[2] || 'Todas';

            return {
              id: item.id,
              code: item.code,
              realCode: realCode,
              discountPercent: item.discount_value,
              category: cat,
              expiresAt: new Date(item.expires_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }),
              createdAt: new Date(item.created_at).toLocaleDateString('pt-BR')
            };
          });

        setCampaigns(mapped);
      }
    } catch (err) {
      console.error('Erro ao buscar campanhas da plataforma:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      if (data) {
        const unique = Array.from(
          new Set(
            data
              .flatMap((p: any) => (p.category || '').split(','))
              .map((c: string) => c.trim())
              .filter(Boolean)
          )
        );
        setCategories(unique);
        if (unique.length > 0) {
          setCategory(unique[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar categorias dinâmicas:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCategories();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount <= 0 || discount >= 100) {
      alert('Defina um desconto válido entre 1% e 99%.');
      return;
    }

    if (!endDate) {
      alert('Selecione a data de expiração da campanha.');
      return;
    }

    setSubmitting(true);
    try {
      // Monta o código codificado com CAMP#CODE#CATEGORY
      const formattedCode = `CAMP#${code.trim().toUpperCase()}#${category}`;
      const expiresAtIso = new Date(endDate).toISOString();

      const { error } = await supabase
        .from('coupons')
        .insert({
          code: formattedCode,
          discount_value: discount,
          type: 'percent',
          expires_at: expiresAtIso,
          created_by: 'admin',
          max_uses: 999999,
          store_id: null
        });

      if (error) throw error;

      alert('Campanha de desconto publicada com sucesso!');
      setCode('');
      setDiscountValue('15');
      setCategory('Todas');
      setEndDate('');
      fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      alert(err.message?.includes('duplicate') ? 'Já existe uma campanha com este código.' : 'Erro ao criar campanha.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndCampaign = async (id: string, name: string) => {
    const confirmDelete = confirm(`Deseja realmente encerrar a campanha "${name}"? Os lojistas não poderão mais aderir a ela.`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Campanha encerrada com sucesso!');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Erro ao encerrar campanha.');
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Campanhas de Desconto do Marketplace</h1>
          <p style={styles.pageSubtitle}>Crie campanhas de desconto globais por categoria. Os lojistas poderão aderir selecionando seus produtos correspondentes.</p>
        </div>
      </section>

      <div style={styles.mainGrid}>
        
        {/* Lado Esquerdo: Formulário */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Nova Campanha de Desconto</h2>
          <form onSubmit={handleCreateCampaign} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Código da Campanha (EX: DIADOSPAIS)</label>
              <input 
                type="text" 
                placeholder="EX: TEFEVERAO" 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                style={styles.formInput} 
                required 
              />
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Desconto (%)</label>
                <div style={styles.inputWrapper}>
                  <input 
                    type="number" 
                    placeholder="15" 
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={styles.formInput} 
                    required 
                  />
                  <span style={styles.suffix}>%</span>
                </div>
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Categoria Limitadora</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.selectInput}
                  required
                >
                  {categories.length === 0 ? (
                    <option value="">Nenhuma categoria cadastrada</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Data de Expiração da Campanha</label>
              <input 
                type="datetime-local" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.formInput} 
                required 
              />
            </div>

            <button type="submit" style={styles.createBtn} disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar Campanha no Marketplace'}
            </button>

          </form>
        </section>

        {/* Lado Direito: Listagem */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Campanhas Ativas</h2>
          
          <div style={styles.tableWrapper}>
            {loading ? (
              <p style={styles.emptyText}>Carregando campanhas...</p>
            ) : campaigns.length === 0 ? (
              <p style={styles.emptyText}>Nenhuma campanha global ativa no momento.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Campanha</th>
                    <th style={styles.th}>Desconto</th>
                    <th style={styles.th}>Categoria</th>
                    <th style={styles.th}>Expira em</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(camp => (
                    <tr key={camp.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: '750' }}>{camp.realCode}</td>
                      <td style={{ ...styles.td, color: 'var(--secondary)', fontWeight: '800' }}>
                        {camp.discountPercent}% OFF
                      </td>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>{camp.category}</span>
                      </td>
                      <td style={styles.td}>{camp.expiresAt}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button 
                          onClick={() => handleEndCampaign(camp.id, camp.realCode)} 
                          style={styles.endBtn}
                        >
                          Encerrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '24px',
    alignItems: 'start',
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
  cardTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '12px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
  selectInput: {
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
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  suffix: {
    position: 'absolute',
    right: '12px',
    fontWeight: '750',
    color: 'var(--outline)',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  createBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '14px',
    fontSize: '14.5px',
    fontWeight: '850',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(110, 0, 193, 0.15)',
    transition: 'all 0.2s',
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
  tr: {
    borderBottom: '1px solid var(--surface-container-highest)',
  },
  td: {
    padding: '16px',
    fontSize: '14.5px',
    color: 'var(--on-surface)',
  },
  categoryBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface)',
    fontSize: '11px',
    fontWeight: '800',
  },
  endBtn: {
    border: 'none',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--outline)',
    textAlign: 'center',
    padding: '24px 0',
    margin: 0,
    fontWeight: '600',
  }
};
