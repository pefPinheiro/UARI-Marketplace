import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { dbService, DBProduct } from '../../services/database';

export default function StoreProfileScreen() {
  const { activeStore, setActiveProduct } = useApp();
  const { goBack, navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<'produtos' | 'informacoes'>('produtos');
  const [storeProducts, setStoreProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadStoreProducts();
  }, [activeStore]);

  const loadStoreProducts = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const fetched = await dbService.fetchProductsByStore(activeStore.id);
      // Se não houver produtos no banco, coloca alguns presets
      if (fetched && fetched.length > 0) {
        setStoreProducts(fetched);
      } else {
        setStoreProducts([
          { id: 'p1', title: 'Castanha do Pará (500g)', current_price: 25.00, original_price: 30.00, images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'], category: 'Mercado', store_id: activeStore.id, status: 'published', stock: 10, is_featured: true, created_at: '' },
          { id: 'p2', title: 'Açaí Regional (1L)', current_price: 18.00, original_price: 22.00, images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'], category: 'Mercado', store_id: activeStore.id, status: 'published', stock: 10, is_featured: true, created_at: '' }
        ] as any);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: any) => {
    setActiveProduct(product);
    navigate('product_details');
  };

  if (!activeStore) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Nenhuma loja selecionada!</Text>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Figma */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backIconBtn} onPress={goBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareIcon}>🔗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Capa/Banner da Loja Figma */}
        <Image 
          source={{ uri: activeStore.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80' }} 
          style={styles.bannerImg} 
        />

        {/* Informações da Loja Figma */}
        <View style={styles.storeHeaderBox}>
          <View style={styles.storeProfileRow}>
            {/* Foto Circular da Loja */}
            <View style={styles.storeAvatarContainer}>
              <Text style={styles.storeAvatarEmoji}>🌰</Text>
            </View>

            {/* Nome e Rating */}
            <View style={styles.storeNameContainer}>
              <Text style={styles.storeName}>{activeStore.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingVal}>{activeStore.rating || '4.9'}</Text>
              </View>
            </View>

            {/* Botão Seguir */}
            <TouchableOpacity 
              style={[
                styles.followBtn,
                isFollowing && { backgroundColor: '#ECEFF1' }
              ]} 
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={[
                styles.followBtnText,
                isFollowing && { color: COLORS.marromPremium }
              ]}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          <Text style={styles.storeDesc}>
            {activeStore.description || 'O melhor da floresta direto para sua mesa em Tefé.'}
          </Text>
        </View>

        {/* Abas da Loja Figma */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'produtos' && styles.activeTabBtn]}
            onPress={() => setActiveTab('produtos')}
          >
            <Text style={[styles.tabText, activeTab === 'produtos' && styles.activeTabText]}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'informacoes' && styles.activeTabBtn]}
            onPress={() => setActiveTab('informacoes')}
          >
            <Text style={[styles.tabText, activeTab === 'informacoes' && styles.activeTabText]}>Informações</Text>
          </TouchableOpacity>
        </View>

        {/* Exibição da Aba Produtos */}
        {activeTab === 'produtos' ? (
          loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.roxoDigital} />
          ) : (
            <View style={styles.productsGrid}>
              {storeProducts.map((prod) => (
                <TouchableOpacity 
                  key={prod.id} 
                  style={styles.productCard}
                  activeOpacity={0.9}
                  onPress={() => handleProductPress(prod)}
                >
                  <Image source={prod.images && prod.images[0] ? { uri: prod.images[0] } : require('../../../assets/logo.png')} style={styles.productImage} />
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>✓ VERIFICADO</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={1}>{prod.title}</Text>
                    <Text style={styles.productPrice}>R$ {Number(prod.current_price).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          /* Exibição da Aba Informações Figma */
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Onde nos encontrar</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>
                {activeStore.address?.street || 'Rua do Comércio, 123 - Centro, Tefé-AM - 69470-000'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🕒</Text>
              <Text style={styles.infoText}>
                Aberto Agora {"\n"}Seg - Sáb: 08:00 às 18:00
              </Text>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.marromPremium,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: COLORS.roxoDigital,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.pureWhite,
    fontWeight: '700',
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
  backIconBtn: {
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
  shareBtn: {
    padding: 6,
  },
  shareIcon: {
    fontSize: 18,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerImg: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.offWhite,
  },
  storeHeaderBox: {
    backgroundColor: COLORS.pureWhite,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storeProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -24,
  },
  storeAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.offWhite,
    borderWidth: 3,
    borderColor: COLORS.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeAvatarEmoji: {
    fontSize: 28,
  },
  storeNameContainer: {
    flex: 1,
    marginLeft: 12,
    marginTop: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingVal: {
    fontSize: 12,
    color: COLORS.grayText,
    fontWeight: '700',
  },
  followBtn: {
    backgroundColor: '#5D4037', // Marrom do figma
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  followBtnText: {
    color: COLORS.pureWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  storeDesc: {
    fontSize: 13,
    color: COLORS.grayText,
    marginTop: 12,
    lineHeight: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: COLORS.roxoDigital,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.grayText,
  },
  activeTabText: {
    color: COLORS.roxoDigital,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productCard: {
    backgroundColor: COLORS.pureWhite,
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.offWhite,
  },
  verifiedTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifiedTagText: {
    color: '#2E7D32',
    fontSize: 8,
    fontWeight: '800',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.laranjaAcao,
    marginTop: 4,
  },
  infoBox: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.marromPremium,
    lineHeight: 20,
    fontWeight: '600',
  },
});
