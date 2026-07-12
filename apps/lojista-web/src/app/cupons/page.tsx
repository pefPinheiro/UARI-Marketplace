'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLojista } from '../layout-client';
import { lojistaService, DBCoupon, DBProduct } from '../../services/lojista';
import { supabase } from '../../lib/supabase';

interface ActivePromotion {
  id: string; // promotion DB id or product DB id
  productId: string;
  productTitle: string;
  type: 'period' | 'quantity';
  discountPercent: number;
  startDate?: string;
  endDate?: string;
  minQty?: number;
  originalPrice: number;
  promotionalPrice?: number;
}

interface PlatformCampaign {
  id: string;
  code: string;
  realCode: string;
  discountPercent: number;
  category: string;
  expiresAt: string;
  rawExpiresAt: string;
}

export default function PromotionsPage() {
  const { store } = useLojista();
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons'>('promotions');
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [coupons, setCoupons] = useState<DBCoupon[]>([]);
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>([]);
  const [platformCampaigns, setPlatformCampaigns] = useState<PlatformCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // States: Formulário de Promoção Própria
  const [promoType, setPromoType] = useState<'period' | 'quantity'>('period');
  const [promoDiscount, setPromoDiscount] = useState('15');
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [promoMinQty, setPromoMinQty] = useState('3');
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<{ [key: string]: boolean }>({});

  // States: Formulário de Cupom
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('10');
  const [couponMaxUses, setCouponMaxUses] = useState('100');

  // States: Modal de Adesão à Campanha do Marketplace
  const [joiningCampaign, setJoiningCampaign] = useState<PlatformCampaign | null>(null);
  const [campaignProductIds, setCampaignProductIds] = useState<{ [key: string]: boolean }>({});

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      // 1. Fetch produtos e cupons da loja
      const prodList = await lojistaService.fetchStoreProducts(store.id);
      setProducts(prodList);

      const couponList = await lojistaService.fetchStoreCoupons(store.id);
      setCoupons(couponList);

      // 2. Fetch promoções baseadas em período (da tabela promotions)
      const { data: dbPromos, error: dbPromosErr } = await supabase
        .from('promotions')
        .select('*, products!inner(*)')
        .eq('products.store_id', store.id)
        .eq('is_active', true);

      if (dbPromosErr) throw dbPromosErr;

      const mappedPeriodPromos: ActivePromotion[] = (dbPromos || []).map((p: any) => {
        const discPercent = Math.round(
          ((p.products.original_price - p.promotional_price) / p.products.original_price) * 100
        );
        return {
          id: p.id,
          productId: p.product_id,
          productTitle: p.products.title,
          type: 'period',
          discountPercent: discPercent || 15,
          startDate: new Date(p.start_date).toLocaleDateString('pt-BR'),
          endDate: new Date(p.end_date).toLocaleDateString('pt-BR'),
          originalPrice: p.products.original_price,
          promotionalPrice: p.promotional_price
        };
      });

      // 3. Mapear promoções baseadas em quantidade (armazenadas em attributes do produto)
      const mappedQtyPromos: ActivePromotion[] = prodList
        .filter(p => p.attributes?.quantity_discount)
        .map(p => ({
          id: p.id,
          productId: p.id,
          productTitle: p.title,
          type: 'quantity',
          discountPercent: p.attributes.quantity_discount.discount_percent,
          minQty: p.attributes.quantity_discount.min_qty,
          originalPrice: p.current_price
        }));

      setActivePromotions([...mappedPeriodPromos, ...mappedQtyPromos]);

      // 4. Fetch campanhas do Marketplace (Admin)
      const { data: dbCampaigns, error: dbCampaignsErr } = await supabase
        .from('coupons')
        .select('*')
        .eq('created_by', 'admin')
        .is('store_id', null)
        .gt('expires_at', new Date().toISOString());

      if (dbCampaignsErr) throw dbCampaignsErr;

      const mappedCampaigns: PlatformCampaign[] = (dbCampaigns || [])
        .filter((item: any) => item.code.startsWith('CAMP#'))
        .map((item: any) => {
          const parts = item.code.split('#');
          return {
            id: item.id,
            code: item.code,
            realCode: parts[1] || item.code,
            discountPercent: item.discount_value,
            category: parts[2] || 'Todas',
            expiresAt: new Date(item.expires_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            rawExpiresAt: item.expires_at
          };
        });

      setPlatformCampaigns(mappedCampaigns);

      // Pré-inicializa os produtos selecionados
      const initialSelected: { [key: string]: boolean } = {};
      prodList.forEach(p => {
        initialSelected[p.id] = false;
      });
      setSelectedProductIds(initialSelected);
    } catch (err) {
      console.error('Erro ao carregar dados da central de promoções:', err);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setFeedback(null);

    const discount = parseFloat(promoDiscount);
    if (isNaN(discount) || discount <= 0 || discount >= 100) {
      setFeedback({ type: 'error', message: 'Defina um desconto válido entre 1% e 99%.' });
      return;
    }

    const targetProducts = applyToAll 
      ? products 
      : products.filter(p => selectedProductIds[p.id]);

    if (targetProducts.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos um produto para aplicar a promoção.' });
      return;
    }

    setSubmitting(true);
    try {
      if (promoType === 'period') {
        if (!promoStartDate || !promoEndDate) {
          setFeedback({ type: 'error', message: 'Selecione o período de início e término.' });
          setSubmitting(false);
          return;
        }

        const start = new Date(promoStartDate).toISOString();
        const end = new Date(promoEndDate).toISOString();

        for (const prod of targetProducts) {
          const promoPrice = prod.current_price * (1 - discount / 100);
          await lojistaService.createProductPromotion(prod.id, promoPrice, start, end);
        }

        setFeedback({ type: 'success', message: 'Promoção por período cadastrada com sucesso!' });
      } else {
        const qty = parseInt(promoMinQty);
        if (isNaN(qty) || qty <= 1) {
          setFeedback({ type: 'error', message: 'Defina uma quantidade mínima válida (maior que 1).' });
          setSubmitting(false);
          return;
        }

        for (const prod of targetProducts) {
          const updatedAttributes = {
            ...(prod.attributes || {}),
            quantity_discount: {
              min_qty: qty,
              discount_percent: discount
            }
          };
          await lojistaService.updateProduct(prod.id, { attributes: updatedAttributes });
        }

        setFeedback({ type: 'success', message: 'Promoção de quantidade progressiva cadastrada!' });
      }

      setPromoStartDate('');
      setPromoEndDate('');
      setApplyToAll(true);
      await loadData();
    } catch (err) {
      console.error('Erro ao cadastrar promoção:', err);
      setFeedback({ type: 'error', message: 'Erro ao salvar a promoção no banco de dados.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setFeedback(null);

    const val = parseFloat(couponDiscount);
    const uses = parseInt(couponMaxUses);

    if (!couponCode.trim()) {
      setFeedback({ type: 'error', message: 'Digite o código do cupom.' });
      return;
    }
    if (isNaN(val) || val <= 0) {
      setFeedback({ type: 'error', message: 'Defina um desconto válido.' });
      return;
    }

    setSubmitting(true);
    try {
      const success = await lojistaService.createStoreCoupon(
        store.id,
        couponCode.toUpperCase().replace(/\s+/g, ''),
        val,
        'percent',
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        uses
      );

      if (success) {
        setFeedback({ type: 'success', message: `Cupom ${couponCode.toUpperCase()} publicado com sucesso!` });
        setCouponCode('');
        setCouponDiscount('10');
        await loadData();
      } else {
        setFeedback({ type: 'error', message: 'Erro ao cadastrar cupom. O código já existe.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Falha na conexão com o banco de dados.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndPromotion = async (promo: ActivePromotion) => {
    const confirmEnd = confirm(`Deseja realmente encerrar a promoção do produto "${promo.productTitle}"?`);
    if (!confirmEnd) return;

    try {
      if (promo.type === 'period') {
        await lojistaService.cancelProductPromotion(promo.id, promo.productId, promo.originalPrice);
      } else {
        const prod = products.find(p => p.id === promo.productId);
        if (prod) {
          const updatedAttributes = { ...(prod.attributes || {}) };
          delete updatedAttributes.quantity_discount;
          await lojistaService.updateProduct(promo.productId, { attributes: updatedAttributes });
        }
      }
      alert('Promoção encerrada com sucesso!');
      await loadData();
    } catch (err) {
      console.error('Erro ao encerrar promoção:', err);
    }
  };

  // Funções de Adesão à Campanha do Admin
  const handleOpenJoinModal = (campaign: PlatformCampaign) => {
    setJoiningCampaign(campaign);
    // Pré-seleciona os produtos que pertencem à categoria da campanha (com suporte a múltiplas categorias)
    const preselected: { [key: string]: boolean } = {};
    products.forEach(p => {
      const productCategories = (p.category || '').split(',').map(c => c.trim().toLowerCase());
      const matchesCategory = campaign.category === 'Todas' || productCategories.includes(campaign.category.toLowerCase());
      preselected[p.id] = matchesCategory;
    });
    setCampaignProductIds(preselected);
  };

  const handleConfirmJoinCampaign = async () => {
    if (!joiningCampaign || !store?.id) return;

    const selectedProds = products.filter(p => campaignProductIds[p.id]);
    if (selectedProds.length === 0) {
      alert('Selecione pelo menos um produto para participar.');
      return;
    }

    setSubmitting(true);
    try {
      const start = new Date().toISOString();
      const end = joiningCampaign.rawExpiresAt;
      const discount = joiningCampaign.discountPercent;

      for (const prod of selectedProds) {
        const promoPrice = prod.current_price * (1 - discount / 100);

        // 1. Cadastra na tabela promotions
        await lojistaService.createProductPromotion(prod.id, promoPrice, start, end);

        // 2. Atualiza attributes do produto informando a participação na campanha
        const updatedAttributes = {
          ...(prod.attributes || {}),
          platform_campaign: {
            campaign_id: joiningCampaign.id,
            campaign_code: joiningCampaign.realCode,
            discount_percent: discount
          }
        };
        await lojistaService.updateProduct(prod.id, { attributes: updatedAttributes });
      }

      alert(`Você aderiu com sucesso à campanha "${joiningCampaign.realCode}"!`);
      setJoiningCampaign(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao aderir à campanha:', err);
      alert('Ocorreu um erro ao processar sua adesão.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div style={styles.container}>
      
      {/* Top Header Row */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Central de Promoções & Cupons</h1>
          <p style={styles.pageSubtitle}>Gerencie as ofertas, cupons virtuais e regras de acúmulo de desconto progressivo da sua loja.</p>
        </div>
      </section>

      {/* Tabs Selector */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => { setActiveTab('promotions'); setFeedback(null); }}
          style={{ ...styles.tabBtn, ...(activeTab === 'promotions' ? styles.tabBtnActive : {}) }}
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          <span>Criar Promoções de Produtos</span>
        </button>
        <button 
          onClick={() => { setActiveTab('coupons'); setFeedback(null); }}
          style={{ ...styles.tabBtn, ...(activeTab === 'coupons' ? styles.tabBtnActive : {}) }}
        >
          <span className="material-symbols-outlined">sell</span>
          <span>Criar Cupons de Desconto</span>
        </button>
      </div>

      <div style={styles.mainGrid}>
        
        {/* Lado Esquerdo: Formulários de Criação */}
        <div style={styles.leftColumn}>
          
          {feedback && (
            <div style={{
              ...styles.feedbackBox,
              backgroundColor: feedback.type === 'success' ? 'rgba(26, 115, 18, 0.08)' : 'rgba(186, 26, 26, 0.08)',
              color: feedback.type === 'success' ? 'var(--tertiary)' : 'var(--error)',
              marginBottom: '16px'
            }}>
              {feedback.message}
            </div>
          )}

          {activeTab === 'promotions' ? (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Nova Promoção de Catálogo</h2>
              <p style={styles.cardSubtitle}>Crie descontos para um ou uma série de produtos selecionados.</p>

              <form onSubmit={handleCreatePromotion} style={styles.form}>
                
                {/* Tipo de Promoção */}
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Tipo de Campanha Promocional</label>
                  <div style={styles.radioGroup}>
                    <label style={{ ...styles.radioLabel, ...(promoType === 'period' ? styles.radioLabelActive : {}) }}>
                      <input 
                        type="radio" 
                        name="promoType" 
                        value="period" 
                        checked={promoType === 'period'}
                        onChange={() => setPromoType('period')}
                        style={styles.hiddenRadio}
                      />
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
                      <span>Por Período (Data)</span>
                    </label>
                    
                    <label style={{ ...styles.radioLabel, ...(promoType === 'quantity' ? styles.radioLabelActive : {}) }}>
                      <input 
                        type="radio" 
                        name="promoType" 
                        value="quantity" 
                        checked={promoType === 'quantity'}
                        onChange={() => setPromoType('quantity')}
                        style={styles.hiddenRadio}
                      />
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_3</span>
                      <span>Por Quantidade (Progressiva)</span>
                    </label>
                  </div>
                </div>

                {/* Desconto */}
                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Desconto Aplicado (%)</label>
                    <div style={styles.inputWrapper}>
                      <input 
                        type="number" 
                        placeholder="15" 
                        value={promoDiscount} 
                        onChange={(e) => setPromoDiscount(e.target.value)}
                        style={styles.formInput} 
                        required 
                      />
                      <span style={styles.suffix}>%</span>
                    </div>
                  </div>

                  {promoType === 'quantity' && (
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Quantidade Mínima de Compra</label>
                      <input 
                        type="number" 
                        placeholder="3" 
                        value={promoMinQty} 
                        onChange={(e) => setPromoMinQty(e.target.value)}
                        style={styles.formInput} 
                        required 
                      />
                      <span style={styles.helpText}>Ex: Leve {promoMinQty} ou mais e ganhe o desconto.</span>
                    </div>
                  )}
                </div>

                {/* Data: se por período */}
                {promoType === 'period' && (
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Data de Início</label>
                      <input 
                        type="datetime-local" 
                        value={promoStartDate} 
                        onChange={(e) => setPromoStartDate(e.target.value)}
                        style={styles.formInput} 
                        required 
                      />
                    </div>
                    
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Data de Término</label>
                      <input 
                        type="datetime-local" 
                        value={promoEndDate} 
                        onChange={(e) => setPromoEndDate(e.target.value)}
                        style={styles.formInput} 
                        required 
                      />
                    </div>
                  </div>
                )}

                {/* Aplicação da Promoção */}
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Produtos Participantes</label>
                  <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}>
                      <input 
                        type="radio" 
                        name="applyAll" 
                        checked={applyToAll} 
                        onChange={() => setApplyToAll(true)}
                        style={styles.checkbox}
                      />
                      <span>Todos os produtos da loja</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}>
                      <input 
                        type="radio" 
                        name="applyAll" 
                        checked={!applyToAll} 
                        onChange={() => setApplyToAll(false)}
                        style={styles.checkbox}
                      />
                      <span>Selecionar produtos específicos</span>
                    </label>
                  </div>

                  {!applyToAll && (
                    <div style={styles.productsSelectGrid}>
                      {products.map(p => (
                        <div key={p.id} style={styles.productSelectRow} onClick={() => handleToggleSelectProduct(p.id)}>
                          <input 
                            type="checkbox" 
                            checked={!!selectedProductIds[p.id]} 
                            onChange={() => {}}
                            style={styles.checkbox}
                          />
                          <span style={styles.productSelectTitle}>{p.title}</span>
                          <span style={styles.productSelectPrice}>{formatCurrency(p.current_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" style={styles.createBtn} disabled={submitting}>
                  {submitting ? 'Criando Promoção...' : 'Publicar Promoção'}
                </button>

              </form>
            </section>
          ) : (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Gerador de Cupons Master</h2>
              <p style={styles.cardSubtitle}>Crie cupons alfanuméricos globais para campanhas de marketing.</p>

              <form onSubmit={handleCreateCoupon} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Código do Cupom (Sem Espaços)</label>
                  <input 
                    type="text" 
                    placeholder="EX: CASTANHA15" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={styles.formInput} 
                    required 
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Valor do Desconto (%)</label>
                    <div style={styles.inputWrapper}>
                      <input 
                        type="number" 
                        placeholder="10" 
                        value={couponDiscount} 
                        onChange={(e) => setCouponDiscount(e.target.value)}
                        style={styles.formInput} 
                        required 
                      />
                      <span style={styles.suffix}>%</span>
                    </div>
                  </div>

                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Uso Limite Máximo</label>
                    <input 
                      type="number" 
                      placeholder="100" 
                      value={couponMaxUses} 
                      onChange={(e) => setCouponMaxUses(e.target.value)}
                      style={styles.formInput} 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" style={styles.createBtn} disabled={submitting}>
                  {submitting ? 'Emitindo Cupom...' : 'Emitir Cupom'}
                </button>
              </form>
            </section>
          )}

        </div>

        {/* Lado Direito: Listas Ativas e Campanhas do Marketplace */}
        <div style={styles.rightColumn}>
          
          {/* Campanhas do Marketplace (Admin) */}
          <section style={styles.card}>
            <div style={styles.listHeader}>
              <h2 style={styles.cardTitle}>Campanhas do Marketplace (Admin)</h2>
              <span style={{ ...styles.badgeCount, backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
                {platformCampaigns.length} disponíveis
              </span>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--outline)', margin: 0, fontWeight: '600' }}>
              Adira às campanhas ativas da plataforma para promover seus produtos na vitrine principal.
            </p>

            <div style={styles.activeList}>
              {platformCampaigns.length === 0 ? (
                <p style={styles.emptyText}>Nenhuma campanha do marketplace ativa.</p>
              ) : (
                platformCampaigns.map(camp => (
                  <div key={camp.id} style={styles.activePromoCard}>
                    <div style={styles.promoInfo}>
                      <span style={styles.promoProdTitle}>{camp.realCode}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={styles.promoTypeBadge}>Categoria: {camp.category}</span>
                        <span style={styles.promoDiscountText}>{camp.discountPercent}% OFF</span>
                      </div>
                      <span style={styles.promoDetailsText}>Expira em: {camp.expiresAt}</span>
                    </div>

                    <button 
                      onClick={() => handleOpenJoinModal(camp)} 
                      style={styles.joinBtn}
                    >
                      Aderir
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Central de Promoções Ativas */}
          <section style={styles.card}>
            <div style={styles.listHeader}>
              <h2 style={styles.cardTitle}>Promoções Ativas</h2>
              <span style={styles.badgeCount}>{activePromotions.length} ativas</span>
            </div>

            <div style={styles.activeList}>
              {loading ? (
                <p style={styles.emptyText}>Buscando promoções...</p>
              ) : activePromotions.length === 0 ? (
                <p style={styles.emptyText}>Nenhuma promoção ativa cadastrada para seus produtos.</p>
              ) : (
                activePromotions.map(promo => (
                  <div key={promo.id} style={styles.activePromoCard}>
                    <div style={styles.promoInfo}>
                      <span style={styles.promoProdTitle}>{promo.productTitle}</span>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={styles.promoTypeBadge}>
                          {promo.type === 'period' ? 'Por Período' : 'Progressivo'}
                        </span>
                        <span style={styles.promoDiscountText}>
                          {promo.discountPercent}% OFF
                        </span>
                      </div>

                      {promo.type === 'period' ? (
                        <span style={styles.promoDetailsText}>Válido até: {promo.endDate}</span>
                      ) : (
                        <span style={styles.promoDetailsText}>Qtd Mínima: {promo.minQty} unidades</span>
                      )}
                    </div>

                    <button 
                      onClick={() => handleEndPromotion(promo)} 
                      style={styles.endBtn}
                      title="Encerrar promoção"
                    >
                      Encerrar
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Cupons Ativos */}
          <section style={styles.card}>
            <div style={styles.listHeader}>
              <h2 style={styles.cardTitle}>Cupons Cadastrados</h2>
              <span style={styles.badgeCount}>{coupons.length} códigos</span>
            </div>

            <div style={styles.couponsList}>
              {loading ? (
                <p style={styles.emptyText}>Carregando cupons...</p>
              ) : coupons.length === 0 ? (
                <p style={styles.emptyText}>Nenhum cupom ativo na loja.</p>
              ) : (
                coupons.map((c, idx) => (
                  <div key={idx} style={styles.couponItem}>
                    <div>
                      <span style={styles.couponCode}>{c.code}</span>
                      <span style={styles.couponDesc}>{c.discount_value}% OFF • {c.uses_count}/{c.max_uses} usos</span>
                    </div>
                    <span style={styles.activePill}>ATIVO</span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>

      {/* Modal de Adesão à Campanha */}
      {joiningCampaign && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Aderir à Campanha: {joiningCampaign.realCode}</h3>
            <p style={styles.modalDesc}>
              Esta campanha concede <strong>{joiningCampaign.discountPercent}% de desconto</strong> para produtos na categoria <strong>{joiningCampaign.category}</strong>.
              Selecione quais produtos da sua loja farão parte desta promoção.
            </p>

            <div style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Produtos Elegíveis da Sua Loja</label>
                <div style={{ ...styles.productsSelectGrid, maxHeight: '250px' }}>
                  {products
                    .filter(p => {
                      const productCategories = (p.category || '').split(',').map(c => c.trim().toLowerCase());
                      return joiningCampaign.category === 'Todas' || productCategories.includes(joiningCampaign.category.toLowerCase());
                    })
                    .map(p => (
                      <div 
                        key={p.id} 
                        style={styles.productSelectRow}
                        onClick={() => {
                          setCampaignProductIds(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={!!campaignProductIds[p.id]} 
                          onChange={() => {}}
                          style={styles.checkbox}
                        />
                        <span style={styles.productSelectTitle}>{p.title}</span>
                        <span style={styles.productSelectPrice}>{formatCurrency(p.current_price)}</span>
                      </div>
                    ))}

                  {products.filter(p => {
                    const productCategories = (p.category || '').split(',').map(c => c.trim().toLowerCase());
                    return joiningCampaign.category === 'Todas' || productCategories.includes(joiningCampaign.category.toLowerCase());
                  }).length === 0 && (
                    <p style={styles.emptyText}>Você não possui nenhum produto cadastrado na categoria {joiningCampaign.category}.</p>
                  )}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button 
                  onClick={handleConfirmJoinCampaign} 
                  style={styles.confirmBtn}
                  disabled={submitting || products.filter(p => {
                    const productCategories = (p.category || '').split(',').map(c => c.trim().toLowerCase());
                    return joiningCampaign.category === 'Todas' || productCategories.includes(joiningCampaign.category.toLowerCase());
                  }).length === 0}
                >
                  {submitting ? 'Aderindo...' : 'Confirmar Adesão'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setJoiningCampaign(null)} 
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    color: 'var(--primary)',
    fontFamily: 'Plus Jakarta Sans',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: 'var(--on-surface-variant)',
  },
  tabContainer: {
    display: 'flex',
    gap: '16px',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '4px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: '750',
    color: 'var(--outline)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    color: 'var(--primary)',
    fontWeight: '800',
    borderBottom: '3px solid var(--primary)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
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
    gap: '24px',
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
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--outline)',
    margin: 0,
    fontWeight: '600',
    lineHeight: '16px',
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
    fontSize: '13.5px',
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
  helpText: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
    marginTop: '4px',
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
  },
  radioLabel: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    transition: 'all 0.2s',
  },
  radioLabelActive: {
    borderColor: 'var(--primary)',
    backgroundColor: 'rgba(110, 0, 193, 0.04)',
    color: 'var(--primary)',
  },
  hiddenRadio: {
    display: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  productsSelectGrid: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'var(--surface-container-low)',
  },
  productSelectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    backgroundColor: '#ffffff',
  },
  productSelectTitle: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    flex: '1',
  },
  productSelectPrice: {
    fontSize: '13.5px',
    fontWeight: '800',
    color: 'var(--tertiary)',
  },
  createBtn: {
    backgroundColor: 'var(--secondary-container)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '14px',
    fontSize: '14.5px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(254, 107, 0, 0.15)',
    transition: 'all 0.2s',
  },
  feedbackBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '700',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '12px',
  },
  badgeCount: {
    fontSize: '12px',
    fontWeight: '800',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  activeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--outline)',
    textAlign: 'center',
    padding: '24px 0',
    margin: 0,
    fontWeight: '600',
  },
  activePromoCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
  },
  promoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  promoProdTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
  },
  promoTypeBadge: {
    fontSize: '10.5px',
    fontWeight: '800',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--outline)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  promoDiscountText: {
    fontSize: '12px',
    fontWeight: '850',
    color: 'var(--secondary)',
  },
  promoDetailsText: {
    fontSize: '11px',
    color: 'var(--outline)',
    marginTop: '6px',
    fontWeight: '600',
  },
  joinBtn: {
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
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
    transition: 'background-color 0.15s',
  },
  couponsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  couponItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
  },
  couponCode: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  couponDesc: {
    fontSize: '11.5px',
    color: 'var(--outline)',
    marginTop: '2px',
    fontWeight: '600',
    display: 'block',
  },
  activePill: {
    padding: '4px 10px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    color: 'var(--tertiary)',
    fontSize: '11px',
    fontWeight: '800',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '28px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
    fontFamily: 'Plus Jakarta Sans',
  },
  modalDesc: {
    fontSize: '13.5px',
    color: 'var(--outline)',
    margin: 0,
    lineHeight: '18px',
    fontWeight: '600',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  confirmBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13.5px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13.5px',
    fontWeight: '750',
    cursor: 'pointer',
  }
};
