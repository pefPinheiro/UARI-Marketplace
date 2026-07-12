import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { dbService } from '../../services/database';

export default function CartScreen() {
  const { cart, cartCount, updateQuantity, clearCart, setActiveOrder } = useApp();
  const { user } = useAuth();
  const { goBack, navigate } = useNavigation();

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [loading, setLoading] = useState(false);

  // Calcula subtotal
  const subtotal = Object.values(cart).reduce((sum, item) => {
    return sum + (item.product.current_price * item.quantity);
  }, 0);

  const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0.00;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cartCount === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione alguns produtos ao seu carrinho primeiro!');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para finalizar uma compra!');
      return;
    }

    setLoading(true);
    try {
      const itemsList = Object.values(cart).map((item) => ({
        productId: item.product.id,
        price: item.product.current_price,
        quantity: item.quantity
      }));

      // Extrai a primeira loja dos itens ou usa um ID mockado se for preset
      const firstItem = Object.values(cart)[0]?.product;
      const storeId = firstItem?.store_id === 'store-1' || firstItem?.store_id === 'store-2' || firstItem?.store_id === 'store-3'
        ? 'd64bb41e-360e-4361-b4f7-f8f4a13e2bb9' // Id de teste da Loja Castanha & Cia cadastrada na migration
        : (firstItem?.store_id || 'd64bb41e-360e-4361-b4f7-f8f4a13e2bb9');

      if (user.id === 'demo-user-id') {
        // Fluxo demonstração
        const demoOrder = {
          id: `order-demo-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          user_id: user.id,
          store_id: storeId,
          subtotal,
          discount: 0,
          platform_fee: subtotal * 0.10,
          store_net: subtotal * 0.90,
          total,
          status: 'paid', // No demo ja fingimos estar pago
          payment_method: paymentMethod,
          handshake_qr_code: `UARI-DEMO-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          created_at: new Date().toISOString(),
          client: { full_name: 'Ana Clara (Demonstração)' },
          store: { name: firstItem?.store?.name || 'Castanha & Cia 🌰' }
        };

        setActiveOrder(demoOrder);
        clearCart();
        setLoading(false);
        
        Alert.alert(
          'Pagamento Simulado! 🎉',
          'Compra aprovada no portal de demonstração. Vamos visualizar o andamento do pedido.',
          [{ text: 'Ver Pedido', onPress: () => navigate('order_status') }]
        );
        return;
      }

      // Cria pedido real no banco de dados Supabase
      const order = await dbService.createOrder(
        user.id,
        storeId,
        subtotal,
        0, // desconto
        paymentMethod,
        itemsList
      );

      if (order) {
        // Busca o nome da loja para preencher no Objeto
        const storeName = firstItem?.store?.name || 'Loja UÁRI';
        const fullOrderData = {
          ...order,
          store: { name: storeName }
        };

        setActiveOrder(fullOrderData);
        clearCart();
        
        // Simula o pagamento como "pago" imediatamente após PIX
        await dbService.completeHandshake(order.id); // Para testes, finaliza e ativa o escrow!
        
        Alert.alert(
          'Pagamento Confirmado! 🌰',
          `Pedido #${order.id.slice(0, 5).toUpperCase()} gerado com sucesso via Pix! Dinheiro retido em Escrow até a entrega.`,
          [{ text: 'Acompanhar Retirada', onPress: () => navigate('order_status') }]
        );
      } else {
        Alert.alert('Erro', 'Houve uma falha ao processar o seu pedido.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Ocorreu um erro ao finalizar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Figma */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Meu Carrinho</Text>

        {/* Carrinho Vazio */}
        {cartCount === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
            <TouchableOpacity style={styles.goBackShoppingBtn} onPress={goBack}>
              <Text style={styles.goBackShoppingText}>Voltar para ofertas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Lista de Itens do Carrinho Figma */}
            {Object.values(cart).map((item) => (
              <View key={item.product.id} style={styles.cartCard}>
                <Image source={item.product.images && item.product.images[0] ? { uri: item.product.images[0] } : require('../../../assets/logo.png')} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.product.title}</Text>
                  <Text style={styles.itemPrice}>R$ {Number(item.product.current_price).toFixed(2)}</Text>
                  
                  {/* Seletor de Quantidade Figma */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.product.id, -1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.product.id, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Forma de Entrega Figma */}
            <Text style={styles.sectionLabel}>Forma de Entrega</Text>
            <View style={styles.deliveryToggleRow}>
              <TouchableOpacity 
                style={[
                  styles.toggleBtn, 
                  deliveryMethod === 'delivery' && { borderColor: COLORS.roxoDigital, borderWidth: 2 }
                ]}
                onPress={() => setDeliveryMethod('delivery')}
              >
                <Text style={styles.toggleIcon}>🚲</Text>
                <Text style={[
                  styles.toggleText,
                  deliveryMethod === 'delivery' && { color: COLORS.roxoDigital, fontWeight: '800' }
                ]}>Delivery Local</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.toggleBtn, 
                  deliveryMethod === 'pickup' && { borderColor: COLORS.roxoDigital, borderWidth: 2 }
                ]}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <Text style={styles.toggleIcon}>🏪</Text>
                <Text style={[
                  styles.toggleText,
                  deliveryMethod === 'pickup' && { color: COLORS.roxoDigital, fontWeight: '800' }
                ]}>Retirar na Loja</Text>
              </TouchableOpacity>
            </View>

            {/* Método de Pagamento Seguro Figma */}
            <View style={styles.paymentSectionHeader}>
              <Text style={styles.sectionLabel}>Pagamento</Text>
              <View style={styles.secureBadge}>
                <Text style={styles.secureText}>🛡️ Seguro</Text>
              </View>
            </View>

            <View style={styles.paymentBox}>
              <TouchableOpacity 
                style={styles.payOption}
                onPress={() => setPaymentMethod('pix')}
              >
                <View style={styles.radioOuter}>
                  {paymentMethod === 'pix' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.payTextContainer}>
                  <Text style={styles.payTitle}>Pix com 1 clique</Text>
                  <Text style={styles.payDesc}>Aprovação imediata via split escrow</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.payOption}
                onPress={() => setPaymentMethod('credit_card')}
              >
                <View style={styles.radioOuter}>
                  {paymentMethod === 'credit_card' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.payTextContainer}>
                  <Text style={styles.payTitle}>Cartão de Crédito</Text>
                  <Text style={styles.payDesc}>Parcele em até 12x sem juros</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Resumo Financeiro Figma */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({cartCount} itens)</Text>
                <Text style={styles.summaryVal}>R$ {subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
                <Text style={styles.summaryVal}>
                  {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>R$ {total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Botão de Finalização Figma */}
            <TouchableOpacity 
              style={[styles.checkoutBtn, loading && { opacity: 0.8 }]}
              disabled={loading}
              onPress={handleCheckout}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.pureWhite} />
              ) : (
                <Text style={styles.checkoutBtnText}>Finalizar Pagamento Seguro 🔒</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerBranding}>Quebra essa castanha</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  logo: {
    width: 60,
    height: 30,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginTop: 20,
    marginBottom: 16,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.grayText,
    fontWeight: '700',
  },
  goBackShoppingBtn: {
    marginTop: 20,
    backgroundColor: COLORS.roxoDigital,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  goBackShoppingText: {
    color: COLORS.pureWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.pureWhite,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    alignItems: 'center',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.offWhite,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.laranjaAcao,
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginTop: 20,
    marginBottom: 12,
  },
  deliveryToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.pureWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
  },
  toggleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.grayText,
    fontWeight: '700',
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  secureBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  secureText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '800',
  },
  paymentBox: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    padding: 16,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.roxoDigital,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.roxoDigital,
  },
  payTextContainer: {
    flex: 1,
  },
  payTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  payDesc: {
    fontSize: 11,
    color: COLORS.grayText,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    padding: 16,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.grayText,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    color: COLORS.marromPremium,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.laranjaAcao,
  },
  checkoutBtn: {
    backgroundColor: COLORS.laranjaAcao,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: COLORS.laranjaAcao,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  checkoutBtnText: {
    color: COLORS.pureWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  footerBranding: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
    color: COLORS.grayText,
    textAlign: 'center',
    marginTop: 20,
  },
});
