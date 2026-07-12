import { supabase } from '../lib/supabase';

export interface DBProduct {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  original_price: number;
  current_price: number;
  images: string[];
  category: string;
  status: 'draft' | 'published' | 'rejected';
  stock: number;
  is_featured: boolean;
  attributes?: any;
  created_at: string;
}

export interface DBOrder {
  id: string;
  user_id: string;
  store_id: string;
  subtotal: number;
  discount: number;
  platform_fee: number;
  store_net: number;
  total: number;
  status: 'pending_payment' | 'paid' | 'ready_for_pickup' | 'completed' | 'disputed' | 'refunded';
  payment_method: 'pix' | 'credit_card';
  handshake_qr_code: string;
  created_at: string;
  client?: {
    full_name: string;
  };
}

export interface DBWallet {
  id: string;
  store_id: string;
  available_balance: number;
  escrow_balance: number;
  updated_at: string;
}

export interface DBTransaction {
  id: string;
  wallet_id: string;
  order_id: string | null;
  type: 'credit_sale' | 'debit_fee' | 'withdrawal' | 'refund';
  amount: number;
  created_at: string;
}

export interface DBCoupon {
  id: string;
  store_id: string | null;
  code: string;
  discount_value: number;
  type: 'percent' | 'value';
  expires_at: string;
  max_uses: number;
  uses_count: number;
  created_by: 'admin' | 'store';
  created_at: string;
}

export const lojistaService = {
  /**
   * Busca a loja associada ao proprietário (ownerId)
   */
  async fetchStoreByOwner(ownerId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', ownerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Sem loja cadastrada
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Erro ao buscar loja do lojista:', err);
      return null;
    }
  },

  /**
   * Inicializa uma loja padrão para teste em NextJS caso o lojista não possua loja ainda
   */
  async createDemoStore(ownerId: string, name: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_id: ownerId,
          name: name,
          description: 'Loja padrão criada pelo Painel UÁRI Lojista Web.',
          is_verified: true,
          address: { city: 'Tefé', state: 'AM', street: 'Rua do Comércio, 123' }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar loja demonstrativa:', err);
      return null;
    }
  },

  /**
   * Consulta estatísticas de visitas e produtos da loja (Substitui o antigo financeiro/carteira)
   */
  async fetchStoreWallet(storeId: string): Promise<any | null> {
    try {
      // 1. Contador de visitas físicas (check-ins)
      const { count: visitsCount } = await supabase
        .from('store_visits')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      // 2. Contador de produtos publicados
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('status', 'published');

      // 3. Contador de cupons
      const { count: couponsCount } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      return {
        id: storeId,
        store_id: storeId,
        available_balance: visitsCount || 0, // Mapeado para total de visitas
        escrow_balance: productsCount || 0,     // Mapeado para produtos publicados
        coupons_count: couponsCount || 0,
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Erro ao buscar estatísticas da loja:', err);
      return null;
    }
  },

  /**
   * Consulta histórico de visitas físicas (check-ins) na loja
   */
  async fetchWalletTransactions(storeId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('store_visits')
        .select('*, client:profiles(full_name)')
        .eq('store_id', storeId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      // Adaptar para o formato esperado pela listagem de transações se necessário, ou retornar como histórico de visitas
      return (data || []).map(v => ({
        id: v.id,
        wallet_id: storeId,
        order_id: null,
        type: 'credit_sale',
        amount: v.points_awarded,
        created_at: v.scanned_at,
        client_name: v.client?.full_name || 'Cliente UÁRI'
      }));
    } catch (err) {
      console.error('Erro ao buscar visitas:', err);
      return [];
    }
  },

  /**
   * Simulação: Lojistas não fazem saques financeiros, apenas mostram informações.
   */
  async requestPixWithdrawal(storeId: string, amount: number, pixKey: string): Promise<boolean> {
    console.log('Saque financeiro desativado. Plataforma opera em modelo vitrine.');
    return true;
  },

  /**
   * Consulta todos os produtos cadastrados da loja
   */
  async fetchStoreProducts(storeId: string): Promise<DBProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DBProduct[];
    } catch (err) {
      console.error('Erro ao buscar produtos da loja:', err);
      return [];
    }
  },

  /**
   * Faz upload da imagem de rascunho do produto para o bucket "products" no Supabase Storage
   */
  async uploadProductImage(storeId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      return null;
    }
  },

  /**
   * Envia rascunho de produto bruta para curadoria do Admin
   */
  async createProductDraft(storeId: string, title: string, price: number, category: string, imageUrl: string, attributes?: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          title,
          description: 'Foto enviada via Painel UÁRI Lojista Web para curadoria profissional (Studio UÁRI).',
          original_price: price * 1.25, //Markup original de vitrine
          current_price: price,
          images: [imageUrl],
          category,
          status: 'draft',
          stock: 20,
          attributes: attributes || {}
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao criar draft de produto:', err);
      return false;
    }
  },

  /**
   * Cria um produto no banco de dados com dados completos
   */
  async createProduct(productData: Partial<DBProduct>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          ...productData,
          status: productData.status || 'draft',
          stock: 20
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      return false;
    }
  },

  /**
   * Cria uma promoção para um produto e atualiza seu preço atual
   */
  async createProductPromotion(productId: string, promotionalPrice: number, startDate: string, endDate: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          product_id: productId,
          promotional_price: promotionalPrice,
          start_date: startDate,
          end_date: endDate,
          is_active: true
        });

      if (error) throw error;

      // Atualiza o preço atual do produto para o valor promocional
      const { error: prodError } = await supabase
        .from('products')
        .update({ current_price: promotionalPrice })
        .eq('id', productId);

      if (prodError) throw prodError;

      return true;
    } catch (err) {
      console.error('Erro ao criar promoção:', err);
      return false;
    }
  },

  /**
   * Atualiza/edita uma promoção existente e ajusta o preço atual do produto
   */
  async updateProductPromotion(promotionId: string, productId: string, promotionalPrice: number, endDate: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          promotional_price: promotionalPrice,
          end_date: endDate
        })
        .eq('id', promotionId);

      if (error) throw error;

      // Atualiza o preço do produto correspondente
      const { error: prodError } = await supabase
        .from('products')
        .update({ current_price: promotionalPrice })
        .eq('id', productId);

      if (prodError) throw prodError;

      return true;
    } catch (err) {
      console.error('Erro ao atualizar promoção:', err);
      return false;
    }
  },

  /**
   * Cancela uma promoção (desativa) e restaura o preço original do produto
   */
  async cancelProductPromotion(promotionId: string, productId: string, originalPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: false })
        .eq('id', promotionId);

      if (error) throw error;

      // Restaura o preço do produto para o original_price
      const { error: prodError } = await supabase
        .from('products')
        .update({ current_price: originalPrice })
        .eq('id', productId);

      if (prodError) throw prodError;

      return true;
    } catch (err) {
      console.error('Erro ao cancelar promoção:', err);
      return false;
    }
  },

  /**
   * Consulta promoções ativas do produto
   */
  async fetchProductPromotions(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar promoções do produto:', err);
      return [];
    }
  },

  /**
   * Consulta todas as promoções ativas de uma loja
   */
  async fetchStorePromotions(storeId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*, products!inner(*)')
        .eq('products.store_id', storeId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar promoções da loja:', err);
      return [];
    }
  },

  /**
   * Atualiza as informações de um produto no banco de dados
   */
  async updateProduct(productId: string, updates: Partial<DBProduct>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      return false;
    }
  },

  /**
   * Atualiza o status/visibilidade de um produto
   */
  async updateProductStatus(productId: string, status: 'published' | 'draft'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar status do produto:', err);
      return false;
    }
  },

  /**
   * Atualiza o preço atual de um produto
   */
  async updateProductPrice(productId: string, price: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          current_price: price,
          original_price: price * 1.25 // Markup de vitrine correspondente
        })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar preço do produto:', err);
      return false;
    }
  },

  /**
   * Consulta todos os cupons promocionais da loja
   */
  async fetchStoreCoupons(storeId: string): Promise<DBCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DBCoupon[];
    } catch (err) {
      console.error('Erro ao buscar cupons da loja:', err);
      return [];
    }
  },

  /**
   * Cria novo cupom promocional para a loja
   */
  async createStoreCoupon(
    storeId: string,
    code: string,
    discountValue: number,
    type: 'percent' | 'value',
    expiresAt: string,
    maxUses: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          store_id: storeId,
          code: code.toUpperCase().trim(),
          discount_value: discountValue,
          type,
          expires_at: expiresAt,
          max_uses: maxUses,
          uses_count: 0,
          created_by: 'store'
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao criar cupom de desconto:', err);
      return false;
    }
  },

  /**
   * Consulta pedidos associados à loja que aguardam handshake de entrega
   */
  async fetchPendingOrders(storeId: string): Promise<DBOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:profiles(full_name)')
        .eq('store_id', storeId)
        .in('status', ['paid', 'ready_for_pickup', 'pending_payment']);

      if (error) throw error;
      return data as DBOrder[];
    } catch (err) {
      console.error('Erro ao buscar pedidos pendentes:', err);
      return [];
    }
  },

  /**
   * Efetua a liberação do split escrow completando o handshake do pedido
   */
  async completeHandshake(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao concluir handshake de entrega:', err);
      return false;
    }
  },

  /**
   * Confirma o recebimento do pagamento direto (offline) do cliente
   */
  async confirmOrderPayment(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao confirmar pagamento offline do pedido:', err);
      return false;
    }
  },

  /**
   * Atualiza a identidade visual, descrição e horário de funcionamento da loja
   */
  async updateStoreSettings(
    storeId: string,
    description: string,
    logoUrl: string,
    bannerUrl: string,
    address: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          description,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          address
        })
        .eq('id', storeId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar configurações da loja:', err);
      return false;
    }
  },

  /**
   * Consulta/Simula mensagens de atendimento ativas da loja
   */
  async fetchStoreMessages(storeId: string): Promise<any[]> {
    try {
      // Simulação premium de threads de chat com clientes de Tefé para o painel Figma
      return [
        {
          id: 'chat-1',
          clientName: 'Maria Antônia Souza',
          clientAvatar: '👩‍🦰',
          lastMessage: 'Olá! Já fiz o Pix do pote de castanhas, pode verificar?',
          time: '14:02',
          unread: true,
          status: 'Pendente',
          messages: [
            { sender: 'client', text: 'Boa tarde! Gostaria de encomendar 2 potes de castanha do Pará.', time: '13:45' },
            { sender: 'store', text: 'Olá Maria! Temos à pronta entrega sim. Você prefere retirar no balcão ou entrega?', time: '13:50' },
            { sender: 'client', text: 'Vou querer entrega para o centro de Tefé.', time: '13:52' },
            { sender: 'store', text: 'Perfeito! O total com entrega fica R$ 48,00. Pode enviar o Pix direto para a nossa chave cadastrada.', time: '13:55' },
            { sender: 'client', text: 'Olá! Já fiz o Pix do pote de castanhas, pode verificar?', time: '14:02' }
          ]
        },
        {
          id: 'chat-2',
          clientName: 'Raimundo Nonato',
          clientAvatar: '👨‍🌾',
          lastMessage: 'Estou saindo para retirar a farinha de Uarini agora.',
          time: '11:15',
          unread: false,
          status: 'Finalizado',
          messages: [
            { sender: 'client', text: 'A farinha de Uarini do saco amarelo é bem fininha?', time: '10:30' },
            { sender: 'store', text: 'Sim, Raimundo! É farinha do tipo ovinha premium, super crocante e selecionada.', time: '10:35' },
            { sender: 'client', text: 'Vou querer 5kg. Reservando para mim.', time: '10:40' },
            { sender: 'store', text: 'Combinado! Está reservado no seu nome.', time: '10:42' },
            { sender: 'client', text: 'Estou saindo para retirar a farinha de Uarini agora.', time: '11:15' }
          ]
        },
        {
          id: 'chat-3',
          clientName: 'Ana Cláudia Tefé',
          clientAvatar: '👱‍♀️',
          lastMessage: 'Vocês têm artesanato em madeira de Muirapiranga?',
          time: 'Ontem',
          unread: false,
          status: 'Finalizado',
          messages: [
            { sender: 'client', text: 'Vocês têm artesanato em madeira de Muirapiranga?', time: 'Ontem' },
            { sender: 'store', text: 'Olá Ana! Temos sim, recebemos ontem algumas peças exclusivas de barcos e bandejas lapidadas à mão.', time: 'Ontem' }
          ]
        }
      ];
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      return [];
    }
  }
};
