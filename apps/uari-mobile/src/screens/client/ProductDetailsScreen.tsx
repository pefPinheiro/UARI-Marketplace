import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export default function ProductDetailsScreen() {
  const { activeProduct, addToCart } = useApp();
  const { goBack } = useNavigation();

  const [selectedSize, setSelectedSize] = useState<'P' | 'M' | 'G' | 'GG'>('M');
  const [isFavorite, setIsFavorite] = useState(false);

  if (!activeProduct) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Nenhum produto selecionado!</Text>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addToCart(activeProduct);
    Alert.alert(
      'Adicionado ao Carrinho! 🌰',
      `O produto "${activeProduct.title}" (Tamanho ${selectedSize}) foi adicionado com sucesso ao seu carrinho.`,
      [
        { text: 'Continuar Comprando', style: 'cancel' },
        { text: 'Ir para o Carrinho', onPress: () => goBack() } // Vai voltar, onde ele pode ir no Carrinho
      ]
    );
  };

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
        <TouchableOpacity style={styles.favoriteBtn} onPress={() => setIsFavorite(!isFavorite)}>
          <Text style={[styles.heartIcon, isFavorite && { color: '#E53935' }]}>
            {isFavorite ? '❤️' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Large Product Image Figma */}
        <View style={styles.imageCard}>
          <Image 
            source={activeProduct.images && activeProduct.images[0] ? { uri: activeProduct.images[0] } : require('../../../assets/logo.png')} 
            style={styles.productImg}
            resizeMode="cover"
          />
        </View>

        {/* Verified Seller Badge Figma */}
        <View style={styles.verifiedRow}>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VENDEDOR VERIFICADO</Text>
          </View>
        </View>

        {/* Title & Info */}
        <Text style={styles.productTitle}>{activeProduct.title}</Text>
        
        {/* Price & Discount Figma */}
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>R$ {Number(activeProduct.current_price).toFixed(2)}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>20% OFF</Text>
          </View>
        </View>

        {/* Size Selector Figma */}
        <Text style={styles.sectionLabel}>Selecione o Tamanho</Text>
        <View style={styles.sizeRow}>
          {(['P', 'M', 'G', 'GG'] as const).map((size) => (
            <TouchableOpacity 
              key={size} 
              style={[
                styles.sizePill,
                selectedSize === size && { backgroundColor: COLORS.roxoDigital, borderColor: COLORS.roxoDigital }
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text style={[
                styles.sizeText,
                selectedSize === size && { color: COLORS.pureWhite }
              ]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description Figma */}
        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.descriptionText}>
          {activeProduct.description || 
           `Sinta a leveza de Tefé com o novo Performance Ultra-Light. Desenvolvido com matéria-prima local e solado tecnológico amortecido. Perfeito para o dia a dia na Amazônia.`}
        </Text>
      </ScrollView>

      {/* Bottom Bar: Chat & Quebrar essa castanha Figma */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => Alert.alert('Chat da Loja', 'Abrindo conversa com o lojista...')}>
          <Text style={styles.chatIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} onPress={handleAddToCart}>
          <Text style={styles.buyBtnText}>Quebrar essa castanha 🌰</Text>
        </TouchableOpacity>
      </View>
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
  favoriteBtn: {
    padding: 6,
  },
  heartIcon: {
    fontSize: 22,
    color: COLORS.grayText,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  imageCard: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 24,
    marginTop: 16,
    height: 280,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  verifiedRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginTop: 12,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  discountBadge: {
    backgroundColor: '#FFE0B2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  discountText: {
    color: COLORS.laranjaAcao,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginTop: 24,
    marginBottom: 12,
  },
  sizeRow: {
    flexDirection: 'row',
  },
  sizePill: {
    backgroundColor: COLORS.pureWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.grayText,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.pureWhite,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  chatIcon: {
    fontSize: 20,
  },
  buyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.laranjaAcao,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.laranjaAcao,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buyBtnText: {
    color: COLORS.pureWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});
