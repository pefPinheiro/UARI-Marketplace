import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

interface ClienteTabHomeProps {
  products: any[];
  points: number;
  userName: string;
  onSelectTab: (tab: 'home' | 'busca' | 'pedidos' | 'perfil') => void;
}

export default function ClienteTabHome({ products, points, userName, onSelectTab }: ClienteTabHomeProps) {
  const { addToCart, setActiveProduct, cartCount } = useApp();
  const { navigate } = useNavigation();

  const handleProductPress = (product: any) => {
    setActiveProduct(product);
    navigate('product_details');
  };

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity style={styles.deliverySelector}>
            <Text style={styles.deliveryLabel}>📍 Entregar em: Japiim</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.notificationBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Barra de Pesquisa Falsa (Clica e vai para Busca) */}
        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => onSelectTab('busca')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>O que você procura em Tefé?</Text>
        </TouchableOpacity>

        {/* Banner Promocional Premium */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoLabel}>OFERTAS TECH</Text>
            <Text style={styles.promoTitle}>Semana da Eletrônica</Text>
            <Text style={styles.promoSub}>Até 40% de desconto</Text>
          </View>
          {/* Luzes de neon decorativas mockadas */}
          <View style={styles.neonAccent} />
        </View>

        {/* Categorias Rápidas Figma */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {[
            { label: 'Moda', emoji: '👕' },
            { label: 'Náutica', emoji: '⛵' },
            { label: 'Celulares', emoji: '📱' },
            { label: 'Mercado', emoji: '🛒' }
          ].map((cat, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem} onPress={() => onSelectTab('busca')}>
              <View style={styles.categoryCircle}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.categoryText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vitrine: Castanhas do Dia */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Castanhas do Dia</Text>
            <Text style={styles.sectionSub}>Quebra essa castanha</Text>
          </View>
          <TouchableOpacity onPress={() => onSelectTab('busca')}>
            <Text style={styles.seeAll}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        {/* Grid de produtos de alta fidelidade Figma */}
        <View style={styles.productsGrid}>
          {products.map((prod) => (
            <TouchableOpacity 
              key={prod.id} 
              style={styles.productCard}
              activeOpacity={0.9}
              onPress={() => handleProductPress(prod)}
            >
              <Image source={prod.images && prod.images[0] ? { uri: prod.images[0] } : require('../../../assets/logo.png')} style={styles.productImage} />
              
              {/* Tags Figma */}
              <View style={styles.discountTag}>
                <Text style={styles.discountText}>15% OFF</Text>
              </View>
              <View style={styles.vipTag}>
                <Text style={styles.vipText}>⚙ VIP</Text>
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.storeNameText} numberOfLines={1}>
                  {(prod.store?.name || 'LOJA TECH TEFÉ').toUpperCase()}
                </Text>
                <Text style={styles.productTitle} numberOfLines={1}>{prod.title}</Text>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>De: R$ {Number(prod.original_price).toFixed(0)}</Text>
                  <Text style={styles.currentPriceRow}>
                    <Text style={styles.currentPricePre}>por </Text>
                    <Text style={styles.currentPriceBold}>R$ {Number(prod.current_price).toFixed(2)}</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner Frete Grátis Figma */}
        <View style={styles.shippingBanner}>
          <View style={styles.shippingCircle}>
            <Text style={styles.shippingIcon}>🛍️</Text>
          </View>
          <View style={styles.shippingTextContainer}>
            <Text style={styles.shippingTitle}>Frete Grátis em Tefé</Text>
            <Text style={styles.shippingSub}>Válido para pedidos acima de R$ 50 no bairro Japiim.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Botão Flutuante do Carrinho (FAB) Figma */}
      <TouchableOpacity 
        style={styles.floatingCartBtn}
        activeOpacity={0.9}
        onPress={() => navigate('cart')}
      >
        <Text style={styles.floatingCartIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  header: {
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
  deliverySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.marromPremium,
  },
  chevron: {
    fontSize: 8,
    color: COLORS.marromPremium,
    marginLeft: 4,
  },
  logo: {
    width: 60,
    height: 30,
  },
  notificationBtn: {
    padding: 4,
  },
  bellIcon: {
    fontSize: 18,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pureWhite,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  searchIcon: {
    fontSize: 16,
    color: COLORS.grayText,
    marginRight: 10,
  },
  searchPlaceholder: {
    color: COLORS.grayText,
    fontSize: 14,
  },
  promoBanner: {
    backgroundColor: '#0F0C20',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  promoTextContainer: {
    zIndex: 2,
  },
  promoLabel: {
    color: '#D500F9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promoTitle: {
    color: COLORS.pureWhite,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  promoSub: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 2,
  },
  neonAccent: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#D500F9',
    opacity: 0.2,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginTop: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.marromPremium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.grayText,
    marginTop: 1,
  },
  seeAll: {
    color: '#7B1FA2',
    fontSize: 12,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: COLORS.pureWhite,
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.offWhite,
  },
  discountTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.laranjaAcao,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.pureWhite,
    fontSize: 9,
    fontWeight: '800',
  },
  vipTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vipText: {
    color: COLORS.pureWhite,
    fontSize: 8,
    fontWeight: '800',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginBottom: 6,
  },
  storeNameText: {
    fontSize: 9,
    color: COLORS.grayText,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceContainer: {
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 10,
    color: COLORS.grayText,
    textDecorationLine: 'line-through',
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  currentPricePre: {
    fontSize: 11,
    color: COLORS.marromPremium,
  },
  currentPriceBold: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.laranjaAcao,
  },
  shippingBanner: {
    backgroundColor: '#EDE7F6',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1C4E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shippingIcon: {
    fontSize: 20,
  },
  shippingTextContainer: {
    flex: 1,
  },
  shippingTitle: {
    color: '#512DA8',
    fontWeight: '800',
    fontSize: 14,
  },
  shippingSub: {
    color: '#673AB7',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  floatingCartBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.laranjaAcao,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.laranjaAcao,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingCartIcon: {
    fontSize: 22,
    color: COLORS.pureWhite,
  },
  floatingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.pureWhite,
  },
  floatingBadgeText: {
    color: COLORS.pureWhite,
    fontSize: 9,
    fontWeight: '900',
  },
});
