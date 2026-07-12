import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

interface ClienteTabSearchProps {
  products: any[];
}

export default function ClienteTabSearch({ products }: ClienteTabSearchProps) {
  const { setActiveProduct } = useApp();
  const { navigate } = useNavigation();

  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'Smartwatch',
    'Camisa polo',
    'Castanha do Pará'
  ]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleProductPress = (product: any) => {
    setActiveProduct(product);
    navigate('product_details');
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
  };

  const handleTagPress = (tag: string) => {
    setSearchText(tag);
  };

  // Filtragem dos produtos
  const filteredProducts = products.filter((prod) => {
    const matchesText = prod.title.toLowerCase().includes(searchText.toLowerCase()) ||
                        prod.category.toLowerCase().includes(searchText.toLowerCase());
    
    // Simula o filtro rápido
    if (activeFilter === 'barcos') {
      return matchesText && (prod.category.toLowerCase() === 'náutica' || prod.title.toLowerCase().includes('barco') || prod.title.toLowerCase().includes('lente'));
    }
    return matchesText;
  });

  return (
    <View style={styles.container}>
      {/* Header Fixo de Busca Figma */}
      <View style={styles.header}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            placeholder="Buscar produto"
            placeholderTextColor={COLORS.grayText}
            style={styles.textInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        
        {/* Buscas Recentes Figma */}
        {recentSearches.length > 0 && (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Buscas recentes</Text>
              <TouchableOpacity onPress={handleClearSearches}>
                <Text style={styles.clearBtn}>Limpar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {recentSearches.map((search, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.tagPill}
                  onPress={() => handleTagPress(search)}
                >
                  <Text style={styles.tagText}>🔍 {search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Botões de Filtros Rápidos Figma */}
        <View style={styles.quickFiltersRow}>
          <TouchableOpacity 
            style={[
              styles.filterBtn, 
              { backgroundColor: activeFilter === 'barcos' ? '#7B1FA2' : '#EDE7F6' }
            ]}
            onPress={() => setActiveFilter(activeFilter === 'barcos' ? null : 'barcos')}
          >
            <Text style={[styles.filterEmoji, activeFilter === 'barcos' && { color: COLORS.pureWhite }]}>⛵</Text>
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'barcos' ? COLORS.pureWhite : '#7B1FA2' }
            ]}>Para barcos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterBtn, 
              { backgroundColor: activeFilter === 'perto' ? '#7B1FA2' : '#ECEFF1' }
            ]}
            onPress={() => setActiveFilter(activeFilter === 'perto' ? null : 'perto')}
          >
            <Text style={styles.filterEmoji}>📍</Text>
            <Text style={[
              styles.filterText, 
              { color: activeFilter === 'perto' ? COLORS.pureWhite : COLORS.marromPremium }
            ]}>Perto de mim</Text>
          </TouchableOpacity>
        </View>

        {/* Grade: Os mais procurados Figma */}
        <Text style={styles.gridHeading}>Os mais procurados</Text>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item correspondente encontrado 🌰</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((prod) => (
              <TouchableOpacity 
                key={prod.id} 
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => handleProductPress(prod)}
              >
                <Image source={prod.images && prod.images[0] ? { uri: prod.images[0] } : require('../../../assets/logo.png')} style={styles.productImage} />
                
                <View style={styles.discountTag}>
                  <Text style={styles.discountText}>15% OFF</Text>
                </View>

                <View style={styles.productInfo}>
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
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 40,
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 14,
    color: COLORS.grayText,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.marromPremium,
    padding: 0,
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
  recentContainer: {
    marginTop: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.marromPremium,
  },
  clearBtn: {
    color: COLORS.grayText,
    fontSize: 12,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  tagText: {
    fontSize: 12,
    color: COLORS.marromPremium,
    fontWeight: '700',
  },
  quickFiltersRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gridHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginTop: 24,
    marginBottom: 16,
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
  },
  productImage: {
    width: '100%',
    height: 120,
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
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.marromPremium,
    marginBottom: 6,
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
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.grayText,
    fontSize: 13,
    fontWeight: '600',
  },
});
