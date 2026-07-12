'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLojista } from '../layout-client';
import { lojistaService, DBProduct } from '../../services/lojista';

// Dados reais e mockup do inventário de produtos do Figma
const CATALOG_DEMO = [
  {
    id: '#4492-TEF',
    title: 'Polpa de Açaí Especial 1L',
    category: 'Alimentos',
    price: '25,90',
    stock: 45,
    status: 'active',
    img: 'https://images.unsplash.com/photo-1563865436874-9aef32095ffd?auto=format&fit=crop&q=80&w=300',
    realId: 'demo-1'
  },
  {
    id: '#8821-ART',
    title: 'Cesto de Palha Tucumã G',
    category: 'Artesanato',
    price: '89,00',
    stock: 12,
    status: 'active',
    img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=300',
    realId: 'demo-2'
  },
  {
    id: '#1032-REG',
    title: 'Castanha do Pará Inteira 500g',
    category: 'Regional',
    price: '42,00',
    stock: 0,
    status: 'inactive',
    img: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&q=80&w=300',
    realId: 'demo-3'
  }
];

export default function CatalogPage() {
  const { store } = useLojista();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados locais para controlar alterações de preços e visibilidade
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: string }>({});
  const [itemStatus, setItemStatus] = useState<{ [key: string]: string }>({});
  const [promotionsCount, setPromotionsCount] = useState(0);

  // Estados de Solicitação de Inclusão de Produto
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState('Alimentos');
  const [customCategory, setCustomCategory] = useState('');
  const [reqPrice, setReqPrice] = useState('');
  const [reqComparePrice, setReqComparePrice] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [productImages, setProductImages] = useState<Array<{ id: string, file?: File, url?: string, color: string }>>([]);
  const [selectedColorForImage, setSelectedColorForImage] = useState('Geral');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showInclusionFeedback, setShowInclusionFeedback] = useState(false);
  const [showInclusionForm, setShowInclusionForm] = useState(false);

  // Atributos Avançados de Categoria
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorsList, setColorsList] = useState<Array<{ name: string, file?: File, url?: string }>>([]);
  const [colorInput, setColorInput] = useState('');
  
  // Imagens opcionais para categoria e cor
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryFileUrl, setCategoryFileUrl] = useState('');
  const [colorFile, setColorFile] = useState<File | null>(null);
  const [colorFileUrl, setColorFileUrl] = useState('');

  const [additionalInfo, setAdditionalInfo] = useState<Array<{ key: string; value: string; file?: File; imageUrl?: string }>>([]);
  const [infoKeyInput, setInfoKeyInput] = useState('');
  const [infoValInput, setInfoValInput] = useState('');
  const [infoImageFile, setInfoImageFile] = useState<File | null>(null);

  // Estados do Popup de Detalhes / Promoção
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoValue, setPromoValue] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed'>('percent');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [promoLimit, setPromoLimit] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [productPromotions, setProductPromotions] = useState<any[]>([]);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Estados do Popup de Edição de Produto
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Tags
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (!tagsList.includes(cleanTag)) {
      setTagsList([...tagsList, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter(t => t !== tagToRemove));
  };

  const loadProducts = useCallback(async () => {
    if (!store?.id) return;
    setTimeout(() => setLoading(true), 0); // Asynchronous to avoid ESLint warning in useEffect
    try {
      const prodList = await lojistaService.fetchStoreProducts(store.id);
      setProducts(prodList);

      const promoList = await lojistaService.fetchStorePromotions(store.id);
      setPromotionsCount(promoList?.length || 0);

      // Inicia os estados locais com dados reais do banco
      const pricesInit: { [key: string]: string } = {};
      const statusInit: { [key: string]: string } = {};

      prodList.forEach(p => {
        pricesInit[p.id] = p.current_price.toFixed(2).replace('.', ',');
        statusInit[p.id] = p.status === 'published' ? 'active' : 'inactive';
      });

      setEditedPrices(pricesInit);
      setItemStatus(statusInit);
    } catch (err) {
      console.error('Erro ao buscar catálogo de produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePriceChange = (id: string, val: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const handlePriceBlur = async (id: string, val: string) => {
    if (isDemoMode) return;
    const priceNum = parseFloat(val.replace(',', '.')) || 0;
    if (priceNum <= 0) return;
    const success = await lojistaService.updateProductPrice(id, priceNum);
    if (success) {
      await loadProducts();
    } else {
      alert('Erro ao atualizar preço no banco de dados.');
    }
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !colorsList.some(c => c.name === colorInput.trim())) {
      setColorsList(prev => [...prev, {
        name: colorInput.trim(),
        file: colorFile || undefined,
        url: colorFileUrl || undefined
      }]);
      setColorInput('');
      setColorFile(null);
      setColorFileUrl('');
    }
  };

  const handleRemoveColor = (name: string) => {
    setColorsList(prev => prev.filter(c => c.name !== name));
  };

  const handleAddAdditionalInfo = () => {
    if (infoKeyInput.trim() && infoValInput.trim()) {
      setAdditionalInfo(prev => [
        ...prev,
        {
          key: infoKeyInput.trim(),
          value: infoValInput.trim(),
          file: infoImageFile || undefined,
          imageUrl: infoImageFile ? URL.createObjectURL(infoImageFile) : undefined
        }
      ]);
      setInfoKeyInput('');
      setInfoValInput('');
      setInfoImageFile(null);
    }
  };

  const handleRemoveAdditionalInfo = (index: number) => {
    setAdditionalInfo(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleOpenPromoModal = async (prod: any) => {
    setSelectedProduct(prod);
    setPromoFeedback(null);
    setPromoValue('');
    setPromoLimit('');
    setPromoEndDate('');
    setEditingPromoId(null);
    setShowPromoModal(true);
    
    // Busca promoções ativas do produto
    const activePromos = await lojistaService.fetchProductPromotions(prod.id);
    setProductPromotions(activePromos);
  };

  const handleStartEditPromo = (promo: any) => {
    if (!selectedProduct) return;
    setEditingPromoId(promo.id);
    const orig = selectedProduct.original_price || selectedProduct.current_price;
    const diff = orig - promo.promotional_price;
    
    const pct = Math.round((diff / orig) * 100);
    const calcPromoPricePct = orig * (1 - pct / 100);
    if (Math.abs(calcPromoPricePct - promo.promotional_price) < 0.05) {
      setPromoType('percent');
      setPromoValue(pct.toString());
    } else {
      setPromoType('fixed');
      setPromoValue(diff.toFixed(2));
    }
    
    setPromoEndDate(promo.end_date.split('T')[0]);
  };

  const handleCancelPromotion = async (promoId: string) => {
    if (!selectedProduct || !store?.id) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta promoção?')) return;
    
    setPromoLoading(true);
    setPromoFeedback(null);
    try {
      const origPrice = selectedProduct.original_price || selectedProduct.current_price;
      const success = await lojistaService.cancelProductPromotion(promoId, selectedProduct.id, origPrice);
      if (success) {
        setPromoFeedback('Promoção cancelada com sucesso!');
        setEditingPromoId(null);
        setPromoValue('');
        setPromoEndDate('');
        await loadProducts();
        
        const prodList = await lojistaService.fetchStoreProducts(store.id);
        const updatedProd = prodList.find(p => p.id === selectedProduct.id);
        if (updatedProd) setSelectedProduct(updatedProd);

        const activePromos = await lojistaService.fetchProductPromotions(selectedProduct.id);
        setProductPromotions(activePromos);
      } else {
        setPromoFeedback('Erro ao cancelar a promoção.');
      }
    } catch (err) {
      console.error(err);
      setPromoFeedback('Erro de conexão ao cancelar.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleActivatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !store?.id) return;
    
    const val = parseFloat(promoValue);
    if (isNaN(val) || val <= 0) {
      setPromoFeedback('Defina um valor de desconto válido.');
      return;
    }
    if (!promoEndDate) {
      setPromoFeedback('Escolha uma data de vencimento.');
      return;
    }

    setPromoLoading(true);
    setPromoFeedback(null);

    try {
      const origPrice = selectedProduct.original_price || selectedProduct.current_price;
      let promoPrice = origPrice;
      if (promoType === 'percent') {
        promoPrice = origPrice * (1 - val / 100);
      } else {
        promoPrice = Math.max(0, origPrice - val);
      }

      let success = false;
      if (editingPromoId) {
        success = await lojistaService.updateProductPromotion(
          editingPromoId,
          selectedProduct.id,
          promoPrice,
          new Date(promoEndDate).toISOString()
        );
      } else {
        success = await lojistaService.createProductPromotion(
          selectedProduct.id,
          promoPrice,
          new Date().toISOString(),
          new Date(promoEndDate).toISOString()
        );
      }

      if (success) {
        setPromoFeedback(editingPromoId ? 'Promoção atualizada com sucesso!' : 'Promoção ativada com sucesso!');
        setEditingPromoId(null);
        await loadProducts();
        
        const prodList = await lojistaService.fetchStoreProducts(store.id);
        const updatedProd = prodList.find(p => p.id === selectedProduct.id);
        if (updatedProd) setSelectedProduct(updatedProd);

        const activePromos = await lojistaService.fetchProductPromotions(selectedProduct.id);
        setProductPromotions(activePromos);
        setPromoValue('');
        setPromoEndDate('');
      } else {
        setPromoFeedback('Erro ao ativar a promoção no banco.');
      }
    } catch (err) {
      console.error(err);
      setPromoFeedback('Erro de conexão com o banco.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        file,
        url: URL.createObjectURL(file),
        color: selectedColorForImage
      }));
      setProductImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setProductImages(prev => prev.filter(img => img.id !== imgId));
  };

  const handleUpdateImageColor = (imgId: string, col: string) => {
    setProductImages(prev => prev.map(img => img.id === imgId ? { ...img, color: col } : img));
  };

  const handleOpenEditModal = (prod: DBProduct) => {
    setEditingProduct(prod);
    setEditFeedback(null);
    setReqTitle(prod.title);
    setReqCategory(prod.category);
    setCustomCategory('');
    setReqPrice(prod.current_price.toString());
    setReqComparePrice(prod.original_price ? prod.original_price.toString() : (prod.current_price * 1.25).toString());
    setReqDescription(prod.description || '');
    setIsFeatured(prod.is_featured || false);
    
    // Reseta temporários de imagem
    setCategoryFile(null);
    setCategoryFileUrl(prod.attributes?.category_image || '');
    setColorFile(null);
    setColorFileUrl('');

    // Carrega atributos
    setSelectedSizes(prod.attributes?.sizes || []);
    setTagsList(prod.attributes?.tags || []);
    setTagInput('');
    
    const rawColors = prod.attributes?.colors || [];
    const parsedColors = rawColors.map((c: any) => {
      if (typeof c === 'string') {
        return { name: c };
      }
      return { name: c.name, url: c.imageUrl };
    });
    setColorsList(parsedColors);

    setAdditionalInfo(
      Object.entries(prod.attributes?.additional || {}).map(([key, val]: [string, any]) => {
        const isObj = typeof val === 'object' && val !== null;
        return {
          key,
          value: isObj ? String(val.value) : String(val),
          imageUrl: isObj ? val.imageUrl : undefined
        };
      })
    );
    
    // Carrega imagens existentes e seus mapeamentos
    const existingImgs = (prod.images || []).map((url, i) => ({
      id: `existing-${i}`,
      url,
      color: prod.attributes?.image_mappings?.[url] || 'Geral'
    }));
    setProductImages(existingImgs);
    setShowEditModal(true);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !reqTitle.trim() || !reqPrice) return;

    setEditLoading(true);
    setEditFeedback(null);

    const priceNum = parseFloat(reqPrice) || 0.00;
    const comparePriceNum = parseFloat(reqComparePrice) || priceNum * 1.25;

    try {
      // 1. Upload das imagens principais do produto
      const finalImageUrls: string[] = [];
      const imageMappings: { [url: string]: string } = {};

      for (const img of productImages) {
        if (img.file) {
          const uploadedUrl = await lojistaService.uploadProductImage(editingProduct.store_id, img.file);
          if (uploadedUrl) {
            finalImageUrls.push(uploadedUrl);
            imageMappings[uploadedUrl] = img.color;
          }
        } else if (img.url) {
          finalImageUrls.push(img.url);
          imageMappings[img.url] = img.color;
        }
      }

      // 2. Upload da imagem da categoria (se anexada nova)
      let finalCategoryImageUrl = categoryFileUrl; // mantém se não alterada
      if (categoryFile) {
        const uploadedUrl = await lojistaService.uploadProductImage(editingProduct.store_id, categoryFile);
        if (uploadedUrl) {
          finalCategoryImageUrl = uploadedUrl;
        }
      }

      // 3. Upload das imagens de cada cor da variação
      const finalColors: Array<{ name: string, imageUrl?: string }> = [];
      for (const c of colorsList) {
        if (c.file) {
          const uploadedUrl = await lojistaService.uploadProductImage(editingProduct.store_id, c.file);
          finalColors.push({ name: c.name, imageUrl: uploadedUrl || undefined });
        } else {
          finalColors.push({ name: c.name, imageUrl: c.url || undefined });
        }
      }

      // 4. Upload das imagens das informações customizadas
      const finalAdditional: { [key: string]: any } = {};
      for (const item of additionalInfo) {
        let itemImageUrl = item.imageUrl;
        if (item.file) {
          const uploadedUrl = await lojistaService.uploadProductImage(editingProduct.store_id, item.file);
          if (uploadedUrl) {
            itemImageUrl = uploadedUrl;
          }
        }
        if (itemImageUrl) {
          finalAdditional[item.key] = { value: item.value, imageUrl: itemImageUrl };
        } else {
          finalAdditional[item.key] = item.value;
        }
      }

      const finalCategory = reqCategory === 'custom' ? customCategory.trim() || 'Outro' : reqCategory;
      const attributesObj = {
        sizes: selectedSizes,
        colors: finalColors,
        category_image: finalCategoryImageUrl || undefined,
        additional: finalAdditional,
        image_mappings: imageMappings,
        tags: tagsList
      };

      const success = await lojistaService.updateProduct(editingProduct.id, {
        title: reqTitle.trim(),
        category: finalCategory,
        current_price: priceNum,
        original_price: comparePriceNum,
        description: reqDescription.trim(),
        is_featured: isFeatured,
        images: finalImageUrls,
        attributes: attributesObj,
        status: 'draft' // Volta para rascunho (inativo para o lojista, pendente para o admin)
      });

      if (success) {
        setEditFeedback('Alterações salvas com sucesso!');
        await loadProducts();
        setTimeout(() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }, 1500);
      } else {
        setEditFeedback('Erro ao salvar edições no banco.');
      }
    } catch (err) {
      console.error(err);
      setEditFeedback('Ocorreu um erro ao salvar o produto.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleRequestInclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqPrice) return;

    const priceNum = parseFloat(reqPrice) || 0.00;
    const comparePriceNum = parseFloat(reqComparePrice) || priceNum * 1.25;
    setUploadingImage(true);

    const finalCategory = reqCategory === 'custom' ? customCategory.trim() || 'Outro' : reqCategory;

    try {
      if (store?.id) {
        // 1. Upload de todas as imagens anexadas
        const finalImageUrls: string[] = [];
        const imageMappings: { [url: string]: string } = {};

        for (const img of productImages) {
          if (img.file) {
            const uploadedUrl = await lojistaService.uploadProductImage(store.id, img.file);
            if (uploadedUrl) {
              finalImageUrls.push(uploadedUrl);
              imageMappings[uploadedUrl] = img.color;
            }
          }
        }

        // 2. Upload da imagem da categoria (se anexada)
        let finalCategoryImageUrl = '';
        if (categoryFile) {
          const uploadedUrl = await lojistaService.uploadProductImage(store.id, categoryFile);
          if (uploadedUrl) {
            finalCategoryImageUrl = uploadedUrl;
          }
        }

        // 3. Upload das imagens de cada cor da variação
        const finalColors: Array<{ name: string, imageUrl?: string }> = [];
        for (const c of colorsList) {
          if (c.file) {
            const uploadedUrl = await lojistaService.uploadProductImage(store.id, c.file);
            finalColors.push({ name: c.name, imageUrl: uploadedUrl || undefined });
          } else {
            finalColors.push({ name: c.name, imageUrl: c.url || undefined });
          }
        }

        // 4. Upload das imagens das informações customizadas
        const finalAdditional: { [key: string]: any } = {};
        for (const item of additionalInfo) {
          let itemImageUrl = item.imageUrl;
          if (item.file) {
            const uploadedUrl = await lojistaService.uploadProductImage(store.id, item.file);
            if (uploadedUrl) {
              itemImageUrl = uploadedUrl;
            }
          }
          if (itemImageUrl) {
            finalAdditional[item.key] = { value: item.value, imageUrl: itemImageUrl };
          } else {
            finalAdditional[item.key] = item.value;
          }
        }

        // Prepara os atributos consolidados
        const attributesObj = {
          sizes: selectedSizes,
          colors: finalColors,
          category_image: finalCategoryImageUrl || undefined,
          additional: finalAdditional,
          image_mappings: imageMappings,
          tags: tagsList
        };

        // Salva no banco de dados como rascunho (draft)
        await lojistaService.createProduct({
          store_id: store.id,
          title: reqTitle.trim(),
          category: finalCategory,
          current_price: priceNum,
          original_price: comparePriceNum,
          description: reqDescription.trim() || 'Foto enviada via Painel UÁRI Lojista Web para curadoria profissional (Studio UÁRI).',
          is_featured: isFeatured,
          images: finalImageUrls,
          attributes: attributesObj,
          status: 'draft' // Garante rascunho explicitamente
        });
        
        // Recarrega a listagem de produtos reais do banco de dados
        await loadProducts();
      }

      setShowInclusionFeedback(true);
      setReqTitle('');
      setReqPrice('');
      setReqComparePrice('');
      setReqDescription('');
      setIsFeatured(false);
      setCustomCategory('');
      setSelectedSizes([]);
      setColorsList([]);
      setCategoryFile(null);
      setCategoryFileUrl('');
      setColorFile(null);
      setColorFileUrl('');
      setAdditionalInfo([]);
      setProductImages([]);

      setTimeout(() => {
        setShowInclusionFeedback(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar proposta de produto.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Filtragem de itens do Catálogo
  const isDemoMode = products.length === 0;
  
  const displayItems = isDemoMode
    ? CATALOG_DEMO.map(item => ({
        ...item,
        rawProduct: {
          id: item.realId,
          title: item.title,
          category: item.category,
          original_price: parseFloat(item.price.replace(',', '.')),
          current_price: parseFloat(item.price.replace(',', '.')),
          images: [item.img],
          status: item.status === 'active' ? 'published' : 'draft',
          stock: item.stock,
          is_featured: false,
          attributes: {
            sizes: ['M', 'G'],
            colors: ['Natural'],
            additional: { 'Origem': 'Tefé-AM' }
          },
          created_at: new Date().toISOString()
        } as DBProduct
      }))
    : products.map(p => ({
        id: `#${p.id.slice(0, 5).toUpperCase()}-TEF`,
        title: p.title,
        category: p.category,
        price: editedPrices[p.id] || p.current_price.toFixed(2).replace('.', ','),
        status: itemStatus[p.id] || (p.status === 'published' ? 'active' : 'inactive'),
        img: p.images?.[0] || '/logo.png',
        realId: p.id,
        rawProduct: p
      }));

  const filteredItems = displayItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      
      {/* Top Header Row */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Gestão de Catálogo</h1>
          <p style={styles.pageSubtitle}>Controle seu estoque e preços em tempo real</p>
        </div>
        <button 
          onClick={() => setShowInclusionForm(!showInclusionForm)} 
          style={showInclusionForm ? styles.cancelBtn : styles.addBtn}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {showInclusionForm ? 'close' : 'add_circle'}
          </span>
          <span>{showInclusionForm ? 'Cancelar' : 'Solicitar Novo Produto'}</span>
        </button>
      </section>

      {/* Grid de 4 Cards de Métricas Figma */}
      <section style={styles.metricsGrid}>
        
        {/* KPI 1: Total de Produtos */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(110, 0, 193, 0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>folder_open</span>
            </div>
            <span style={styles.metricValue}>
              {isDemoMode ? CATALOG_DEMO.length : products.length}
            </span>
          </div>
          <span style={styles.metricLabel}>Total de Produtos</span>
        </div>

        {/* KPI 2: Itens Ativos */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(26, 115, 18, 0.08)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>check_circle</span>
            </div>
            <span style={styles.metricValue}>
              {isDemoMode ? 2 : products.filter(p => p.status === 'published').length}
            </span>
          </div>
          <span style={styles.metricLabel}>Itens Ativos</span>
        </div>

        {/* KPI 3: Promoções Ativas */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(254, 107, 0, 0.08)' }}>
              <span className="material-symbols-outlined" style={{ color: '#fe6b00', fontSize: '20px' }}>campaign</span>
            </div>
            <span style={styles.metricValue}>
              {isDemoMode ? 1 : promotionsCount}
            </span>
          </div>
          <span style={styles.metricLabel}>Promoções Ativas</span>
        </div>

        {/* KPI 4: Vendas Pausadas */}
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIconBg, backgroundColor: 'rgba(186, 26, 26, 0.08)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '20px' }}>pause_circle</span>
            </div>
            <span style={styles.metricValue}>
              {isDemoMode ? 1 : products.filter(p => p.status === 'draft').length}
            </span>
          </div>
          <span style={styles.metricLabel}>Vendas Pausadas</span>
        </div>

      </section>

      {showInclusionForm && (
        <section style={styles.inclusionCard}>
          <h2 style={styles.cardTitle}>Solicitar Inclusão de Produto / Serviço</h2>
          <p style={styles.cardSubtitle}>Envie uma proposta de novo produto para a curadoria aprovar no catálogo.</p>
          
          {showInclusionFeedback && (
            <div style={styles.feedbackInclusion}>
              ✓ Proposta enviada com sucesso! O rascunho do item foi inserido no catálogo e aguarda curadoria para ser publicado.
            </div>
          )}

          <form onSubmit={handleRequestInclusion} style={styles.inclusionForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome do Produto/Serviço</label>
              <input 
                type="text" 
                placeholder="Ex: Óleo de Copaíba Puro 100ml" 
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                style={styles.formInput}
                required
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Categoria</label>
                <select 
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="Alimentos">Alimentos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Artesanato">Artesanato</option>
                  <option value="Regional">Regional</option>
                  <option value="custom">+ Outro (Criar Categoria)</option>
                </select>
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Preço de Venda (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="R$ 0,00" 
                  value={reqPrice}
                  onChange={(e) => setReqPrice(e.target.value)}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>Preço Comparativo (Sem Desconto)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="R$ 0,00" 
                  value={reqComparePrice}
                  onChange={(e) => setReqComparePrice(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>

            {reqCategory === 'custom' && (
              <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                <label style={styles.formLabel}>Nome da Nova Categoria</label>
                <input 
                  type="text" 
                  placeholder="Digite o nome da categoria personalizada..." 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  style={styles.formInput}
                  required
                />
              </div>
            )}

            <div style={{ ...styles.formGroup, marginTop: '12px' }}>
              <label style={styles.formLabel}>Descrição Detalhada do Produto</label>
              <textarea 
                placeholder="Descreva os detalhes, história da produção, benefícios..." 
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <input 
                type="checkbox"
                id="is-featured-checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="is-featured-checkbox" style={{ ...styles.formLabel, cursor: 'pointer', marginBottom: 0 }}>
                Destacar este produto no topo da Vitrine (Destaque Principal)
              </label>
            </div>

            {/* Atributos Avançados do Produto */}
            <div style={{ borderTop: '1px solid var(--surface-container-highest)', marginTop: '16px', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>Ficha Técnica & Atributos (Opcional)</h3>
              
              {/* Tamanhos */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tamanhos Disponíveis</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['P', 'M', 'G', 'GG', 'Único'].map((size) => {
                    const active = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleToggleSize(size)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: active ? '1.5px solid var(--primary)' : '1px solid var(--outline-variant)',
                          backgroundColor: active ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                          color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                          fontWeight: active ? '700' : '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cores */}
              <div style={{ ...styles.formGroup, marginTop: '14px' }}>
                <label style={styles.formLabel}>Cores Disponíveis (Com foto opcional)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Ex: Preto, Azul..."
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    style={{ ...styles.formInput, flex: 2 }}
                  />
                  
                  {/* Upload de Foto para a Cor */}
                  <label htmlFor="color-image-upload" style={styles.miniFileUploadLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>palette</span>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {colorFile ? 'Foto OK' : 'Foto (Op.)'}
                    </span>
                  </label>
                  <input 
                    id="color-image-upload"
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setColorFile(file);
                      setColorFileUrl(file ? URL.createObjectURL(file) : '');
                    }}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={handleAddColor}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--surface-container-high)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: '8px',
                      color: 'var(--on-surface)',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    + Cor
                  </button>
                </div>

                {/* Preview temporário de foto da cor antes de adicionar */}
                {colorFileUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={colorFileUrl} alt="Color preview" style={styles.miniThumbnail} />
                    <button type="button" onClick={() => { setColorFile(null); setColorFileUrl(''); }} style={styles.deleteMiniBtn}>Remover Foto da Cor</button>
                  </div>
                )}

                {colorsList.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {colorsList.map((c) => (
                      <span
                        key={c.name}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          backgroundColor: 'var(--surface-container-high)',
                          border: '1px solid var(--outline-variant)',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--on-surface)',
                        }}
                      >
                        {c.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.url} alt={c.name} style={styles.superMiniThumbnail} />
                        )}
                        {c.name}
                        <span
                          onClick={() => handleRemoveColor(c.name)}
                          className="material-symbols-outlined"
                          style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--error)' }}
                        >
                          close
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações Customizadas */}
              <div style={{ ...styles.formGroup, marginTop: '14px' }}>
                <label style={styles.formLabel}>Informações Customizadas (Chave/Valor)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Título (Ex: Material, Origem)"
                    value={infoKeyInput}
                    onChange={(e) => setInfoKeyInput(e.target.value)}
                    style={{ ...styles.formInput, flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Valor (Ex: Madeira, Tefé)"
                    value={infoValInput}
                    onChange={(e) => setInfoValInput(e.target.value)}
                    style={{ ...styles.formInput, flex: 1 }}
                  />
                  
                  {/* Foto da informação customizada (Opcional) */}
                  <label htmlFor="info-image-upload-create" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px dashed var(--outline-variant)',
                    cursor: 'pointer',
                    backgroundColor: infoImageFile ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                    flexShrink: 0
                  }} title="Adicionar imagem (opcional)">
                    {infoImageFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={URL.createObjectURL(infoImageFile)} 
                        alt="Info" 
                        style={{ width: '100%', height: '100%', borderRadius: '7px', objectFit: 'cover' }} 
                      />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--outline)' }}>add_a_photo</span>
                    )}
                  </label>
                  <input 
                    id="info-image-upload-create"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setInfoImageFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={handleAddAdditionalInfo}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--surface-container-high)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: '8px',
                      color: 'var(--on-surface)',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    + Info
                  </button>
                </div>
                {additionalInfo.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {additionalInfo.map((info, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: 'var(--surface-container-low)',
                          border: '1px solid var(--surface-container-highest)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {info.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={info.imageUrl} alt={info.key} style={styles.superMiniThumbnail} />
                          )}
                          <span><strong>{info.key}:</strong> {info.value}</span>
                        </span>
                        <span
                          onClick={() => handleRemoveAdditionalInfo(idx)}
                          className="material-symbols-outlined"
                          style={{ fontSize: '16px', cursor: 'pointer', color: 'var(--error)' }}
                        >
                          delete
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

             {/* Tags para pesquisa */}
            <div style={{ ...styles.formGroup, marginTop: '16px' }}>
              <label style={styles.formLabel}>TAGs do Produto (para pesquisas e filtros na vitrine)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Ex: copaiba, organico, tefe, natural (Enter para adicionar)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  style={styles.formInput}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--surface-container-high)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: '8px',
                    color: 'var(--on-surface)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  + Tag
                </button>
              </div>
              {tagsList.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: 'var(--surface-container-high)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--on-surface)',
                      }}
                    >
                      #{tag}
                      <span
                        onClick={() => handleRemoveTag(tag)}
                        className="material-symbols-outlined"
                        style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--error)' }}
                      >
                        close
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...styles.formGroup, marginTop: '16px' }}>
              <label style={styles.formLabel}>Imagens do Produto (Múltiplas)</label>
              <label htmlFor="product-image-upload" style={styles.fileUploadLabel}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>cloud_upload</span>
                <span style={{ fontWeight: '600', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                  Clique para selecionar uma ou mais imagens do produto
                </span>
                <span style={{ fontSize: '11px', color: 'var(--outline)' }}>Vincule fotos a cores ou características específicas abaixo (Opcional)</span>
              </label>
              <input 
                id="product-image-upload"
                type="file" 
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              {productImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {productImages.map((img) => (
                    <div key={img.id} style={styles.multiImagePreviewCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="Preview" style={styles.multiImageThumbnail} />
                      
                      <div style={{ marginTop: '6px' }}>
                        <select
                          value={img.color}
                          onChange={(e) => handleUpdateImageColor(img.id, e.target.value)}
                          style={styles.colorSelectMini}
                        >
                          <option value="Geral">Cor: Geral</option>
                          {colorsList.map((c) => (
                            <option key={c.name} value={c.name}>Cor: {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        style={styles.removeImageBtn}
                      >
                        ✕ Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button type="submit" style={styles.inclusionBtn} disabled={uploadingImage}>
              {uploadingImage ? 'Fazendo Upload das Imagens...' : 'Enviar Proposta p/ Curadoria'}
            </button>
          </form>
        </section>
      )}

      {/* Tabela de Inventário em Cartão Full-Width */}
      <section style={styles.inventoryCard}>
        
        {/* Sub-header de Inventário */}
        <div style={styles.inventoryHeader}>
          <h2 style={styles.inventoryTitle}>Inventário de Produtos</h2>
          <div style={styles.searchWrapper}>
            <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou categoria..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela Principal */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={{ ...styles.th, width: '100px' }}>Foto</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Categoria</th>
                <th style={{ ...styles.th, width: '160px' }}>Preço Atual (R$)</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'center', width: '220px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const isItemActive = item.status === 'active';
                
                return (
                  <tr key={idx} className="tr-hover" style={styles.tr}>
                    
                    {/* Foto */}
                    <td style={styles.td}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.img} alt={item.title} style={styles.prodImg} />
                    </td>

                    {/* Produto + ID */}
                    <td style={styles.td}>
                      <div style={styles.prodDetails}>
                        <span style={styles.prodTitle}>{item.title}</span>
                        <span style={styles.prodId}>ID: {item.id}</span>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(item.category || '').split(',').map(c => c.trim()).filter(Boolean).map((cat, cIdx) => (
                          <span key={cIdx} style={styles.categoryBadge}>{cat}</span>
                        ))}
                      </div>
                    </td>

                    {/* Preço (Editável Inline) */}
                    <td style={styles.td}>
                      <div style={styles.inputEditWrapper}>
                        <input 
                          type="text" 
                          value={item.price} 
                          onChange={(e) => handlePriceChange(item.realId || String(idx), e.target.value)}
                          onBlur={() => handlePriceBlur(item.realId || String(idx), item.price)}
                          style={styles.priceInput}
                        />
                        <span className="material-symbols-outlined" style={styles.pencilIcon}>edit</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      {isItemActive ? (
                        <span style={styles.statusActive}>
                          <span style={styles.dotGreen}>●</span> Ativo
                        </span>
                      ) : (
                        <span style={styles.statusInactive}>
                          <span style={styles.dotRed}>●</span> Inativo
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                        <button 
                          type="button"
                          onClick={() => handleOpenPromoModal(item.rawProduct)}
                          style={styles.detailsBtn}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                          <span>Métricas & Promoção</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleOpenEditModal(item.rawProduct)}
                          style={styles.editBtn}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          <span>Editar Produto</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação do Inventário */}
        <div style={styles.tableFooter}>
          <span style={styles.paginationText}>
            Exibindo {filteredItems.length} de {isDemoMode ? CATALOG_DEMO.length : products.length} produtos
          </span>
          <div style={styles.paginationBtns}>
            <button style={styles.pageBtnDisabled} disabled>Anterior</button>
            <button style={styles.pageBtnActive} onClick={() => alert('Navegação para a próxima página de catálogo.')}>Próximo</button>
          </div>
        </div>

      </section>

      {/* Footer Inferior */}
      <footer style={styles.bottomFooter}>
        <div style={styles.verifiedRow}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>verified</span>
          <span style={styles.verifiedText}>Vendedor Verificado pela UÁRI em Tefé, Amazonas.</span>
        </div>
        <span style={styles.footerCopyright}>Quebra essa castanha — © 2024 UÁRI Shop Fácil</span>
      </footer>

      {/* Modal de Edição de Produto */}
      {showEditModal && editingProduct && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '650px' }}>
            
            {/* Header */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Editar Produto</h2>
                <p style={styles.cardSubtitle}>Atualize os detalhes do item no catálogo.</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="material-symbols-outlined"
                style={styles.modalCloseBtn}
              >
                close
              </button>
            </div>

            {/* Body */}
            <div style={styles.modalBody}>
              
              {editFeedback && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: editFeedback.includes('sucesso') ? 'rgba(26, 115, 18, 0.08)' : 'rgba(186, 26, 26, 0.08)',
                  color: editFeedback.includes('sucesso') ? 'var(--tertiary)' : 'var(--error)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                }}>
                  {editFeedback}
                </div>
              )}

              <form onSubmit={handleSaveProductEdit} style={styles.inclusionForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nome do Produto/Serviço</label>
                  <input 
                    type="text" 
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Categoria</label>
                    <select 
                      value={reqCategory}
                      onChange={(e) => setReqCategory(e.target.value)}
                      style={styles.formSelect}
                    >
                      <option value="Alimentos">Alimentos</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Artesanato">Artesanato</option>
                      <option value="Regional">Regional</option>
                      <option value="custom">+ Outro (Criar Categoria)</option>
                    </select>
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Preço de Venda (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={reqPrice}
                      onChange={(e) => setReqPrice(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Preço Comparativo</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={reqComparePrice}
                      onChange={(e) => setReqComparePrice(e.target.value)}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {reqCategory === 'custom' && (
                  <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                    <label style={styles.formLabel}>Nome da Nova Categoria</label>
                    <input 
                      type="text" 
                      placeholder="Digite o nome da categoria personalizada..." 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>
                )}

                <div style={{ ...styles.formGroup, marginTop: '12px' }}>
                  <label style={styles.formLabel}>Descrição Detalhada</label>
                  <textarea 
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <input 
                    type="checkbox"
                    id="edit-is-featured-checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="edit-is-featured-checkbox" style={{ ...styles.formLabel, cursor: 'pointer', marginBottom: 0 }}>
                    Destacar este produto no topo da Vitrine (Destaque Principal)
                  </label>
                </div>

                {/* Atributos */}
                <div style={{ borderTop: '1px solid var(--surface-container-highest)', marginTop: '16px', paddingTop: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>Ficha Técnica & Atributos</h3>
                  
                  {/* Tamanhos */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Tamanhos Disponíveis</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {['P', 'M', 'G', 'GG', 'Único'].map((size) => {
                        const active = selectedSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: active ? '1.5px solid var(--primary)' : '1px solid var(--outline-variant)',
                              backgroundColor: active ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                              color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                              fontWeight: active ? '700' : '600',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cores */}
                  <div style={{ ...styles.formGroup, marginTop: '14px' }}>
                    <label style={styles.formLabel}>Cores Disponíveis (Com foto opcional)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Ex: Preto, Azul..."
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        style={{ ...styles.formInput, flex: 2 }}
                      />
                      
                      {/* Upload de Foto para a Cor */}
                      <label htmlFor="edit-color-image-upload" style={styles.miniFileUploadLabel}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>palette</span>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>
                          {colorFile ? 'Foto OK' : 'Foto (Op.)'}
                        </span>
                      </label>
                      <input 
                        id="edit-color-image-upload"
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setColorFile(file);
                          setColorFileUrl(file ? URL.createObjectURL(file) : '');
                        }}
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        onClick={handleAddColor}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: 'var(--surface-container-high)',
                          border: '1px solid var(--outline-variant)',
                          borderRadius: '8px',
                          color: 'var(--on-surface)',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        + Cor
                      </button>
                    </div>

                    {/* Preview temporário de foto da cor antes de adicionar */}
                    {colorFileUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={colorFileUrl} alt="Color preview" style={styles.miniThumbnail} />
                        <button type="button" onClick={() => { setColorFile(null); setColorFileUrl(''); }} style={styles.deleteMiniBtn}>Remover Foto da Cor</button>
                      </div>
                    )}

                    {colorsList.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {colorsList.map((c) => (
                          <span
                            key={c.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              backgroundColor: 'var(--surface-container-high)',
                              border: '1px solid var(--outline-variant)',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--on-surface)',
                            }}
                          >
                            {c.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.url} alt={c.name} style={styles.superMiniThumbnail} />
                            )}
                            {c.name}
                            <span
                              onClick={() => handleRemoveColor(c.name)}
                              className="material-symbols-outlined"
                              style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              close
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações Customizadas */}
                  <div style={{ ...styles.formGroup, marginTop: '14px' }}>
                    <label style={styles.formLabel}>Informações Customizadas</label>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Título"
                        value={infoKeyInput}
                        onChange={(e) => setInfoKeyInput(e.target.value)}
                        style={{ ...styles.formInput, flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Valor"
                        value={infoValInput}
                        onChange={(e) => setInfoValInput(e.target.value)}
                        style={{ ...styles.formInput, flex: 1 }}
                      />

                      {/* Foto da informação customizada (Opcional) */}
                      <label htmlFor="info-image-upload-edit" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px dashed var(--outline-variant)',
                        cursor: 'pointer',
                        backgroundColor: infoImageFile ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                        flexShrink: 0
                      }} title="Adicionar imagem (opcional)">
                        {infoImageFile ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={URL.createObjectURL(infoImageFile)} 
                            alt="Info" 
                            style={{ width: '100%', height: '100%', borderRadius: '7px', objectFit: 'cover' }} 
                          />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--outline)' }}>add_a_photo</span>
                        )}
                      </label>
                      <input 
                        id="info-image-upload-edit"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setInfoImageFile(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        onClick={handleAddAdditionalInfo}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: 'var(--surface-container-high)',
                          border: '1px solid var(--outline-variant)',
                          borderRadius: '8px',
                          color: 'var(--on-surface)',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        + Info
                      </button>
                    </div>
                    {additionalInfo.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {additionalInfo.map((info, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: 'var(--surface-container-low)',
                              border: '1px solid var(--surface-container-highest)',
                              borderRadius: '8px',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {info.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={info.imageUrl} alt={info.key} style={styles.superMiniThumbnail} />
                              )}
                              <span><strong>{info.key}:</strong> {info.value}</span>
                            </span>
                            <span
                              onClick={() => handleRemoveAdditionalInfo(idx)}
                              className="material-symbols-outlined"
                              style={{ fontSize: '16px', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              delete
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                 {/* Tags para pesquisa */}
                <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                  <label style={styles.formLabel}>TAGs do Produto (para pesquisas e filtros na vitrine)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ex: copaiba, organico, tefe, natural (Enter para adicionar)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      style={styles.formInput}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--surface-container-high)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: '8px',
                        color: 'var(--on-surface)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      + Tag
                    </button>
                  </div>
                  {tagsList.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            backgroundColor: 'var(--surface-container-high)',
                            border: '1px solid var(--outline-variant)',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--on-surface)',
                          }}
                        >
                          #{tag}
                          <span
                            onClick={() => handleRemoveTag(tag)}
                            className="material-symbols-outlined"
                            style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--error)' }}
                          >
                            close
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Imagens */}
                <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                  <label style={styles.formLabel}>Imagens do Produto</label>
                  <label htmlFor="edit-product-image-upload" style={styles.fileUploadLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>cloud_upload</span>
                    <span style={{ fontWeight: '600', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                      Clique para selecionar novas fotos
                    </span>
                  </label>
                  <input 
                    id="edit-product-image-upload"
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />

                  {productImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '16px' }}>
                      {productImages.map((img) => (
                        <div key={img.id} style={styles.multiImagePreviewCard}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="Preview" style={styles.multiImageThumbnail} />
                          
                          <div style={{ marginTop: '6px' }}>
                            <select
                              value={img.color}
                              onChange={(e) => handleUpdateImageColor(img.id, e.target.value)}
                              style={styles.colorSelectMini}
                            >
                              <option value="Geral">Cor: Geral</option>
                              {colorsList.map((c) => (
                                <option key={c.name} value={c.name}>Cor: {c.name}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            style={styles.removeImageBtn}
                          >
                            ✕ Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1.5px solid var(--outline-variant)',
                      color: 'var(--on-surface-variant)',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {editLoading ? 'Salvando Alterações...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* Modal de Detalhes, Métricas e Promoção */}
      {showPromoModal && selectedProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            {/* Header do Modal */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedProduct.images?.[0] || '/logo.png'} 
                  alt={selectedProduct.title} 
                  style={styles.modalProductImg} 
                />
                <div>
                  <h2 style={styles.modalTitle}>{selectedProduct.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {(selectedProduct.category || '').split(',').map(c => c.trim()).filter(Boolean).map((cat, cIdx) => (
                      <span key={cIdx} style={styles.categoryBadge}>{cat}</span>
                    ))}
                    {selectedProduct.attributes?.category_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={selectedProduct.attributes.category_image} 
                        alt={selectedProduct.category} 
                        style={styles.superMiniThumbnail} 
                        title={`Imagem da categoria: ${selectedProduct.category}`}
                      />
                    )}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPromoModal(false)}
                className="material-symbols-outlined"
                style={styles.modalCloseBtn}
              >
                close
              </button>
            </div>

            {/* Corpo do Modal */}
            <div style={styles.modalBody}>
              
              {/* Painel de Métricas de Engajamento */}
              <div style={styles.metricsBoxRow}>
                <div style={styles.metricMiniCard}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>visibility</span>
                  <div>
                    <span style={styles.miniCardLabel}>Visualizações</span>
                    <strong style={styles.miniCardValue}>
                      {Math.abs(selectedProduct.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 7) % 850 + 120}
                    </strong>
                  </div>
                </div>
                
                <div style={styles.metricMiniCard}>
                  <span className="material-symbols-outlined" style={{ color: '#e52e50', fontSize: '20px' }}>favorite</span>
                  <div>
                    <span style={styles.miniCardLabel}>Curtidas</span>
                    <strong style={styles.miniCardValue}>
                      {Math.abs(selectedProduct.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 3) % 180 + 15}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica / Atributos do Produto */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Ficha Técnica & Atributos</h4>
                {selectedProduct.attributes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {/* Sizes */}
                    {selectedProduct.attributes.sizes && selectedProduct.attributes.sizes.length > 0 && (
                      <div style={styles.attributeRow}>
                        <span style={styles.attributeLabel}>Tamanhos:</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {selectedProduct.attributes.sizes.map((s: string) => (
                            <span key={s} style={styles.attributeTag}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Colors */}
                    {selectedProduct.attributes.colors && selectedProduct.attributes.colors.length > 0 && (
                      <div style={styles.attributeRow}>
                        <span style={styles.attributeLabel}>Cores:</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {selectedProduct.attributes.colors.map((c: any) => {
                            const cName = typeof c === 'string' ? c : c.name;
                            const cImg = typeof c === 'object' ? c?.imageUrl : null;
                            return (
                              <span key={cName} style={{ ...styles.attributeTag, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {cImg && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={cImg} alt={cName} style={styles.superMiniThumbnail} />
                                )}
                                <span>{cName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Custom Keys */}
                    {selectedProduct.attributes.additional && Object.keys(selectedProduct.attributes.additional).length > 0 && (
                      <div style={{ ...styles.attributeRow, flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={styles.attributeLabel}>Especificações Adicionais:</span>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {Object.entries(selectedProduct.attributes.additional).map(([key, val]: [string, any]) => {
                            const isObj = typeof val === 'object' && val !== null;
                            const textVal = isObj ? val.value : val;
                            const imgUrl = isObj ? val.imageUrl : null;
                            return (
                              <div key={key} style={{ ...styles.specItem, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--outline)' }}>{key}:</span>
                                {imgUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imgUrl} alt={key} style={styles.superMiniThumbnail} />
                                )}
                                <span style={{ color: 'var(--on-surface)', fontWeight: '600' }}>{textVal}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {(!selectedProduct.attributes.sizes || selectedProduct.attributes.sizes.length === 0) &&
                     (!selectedProduct.attributes.colors || selectedProduct.attributes.colors.length === 0) &&
                     (!selectedProduct.attributes.additional || Object.keys(selectedProduct.attributes.additional).length === 0) && (
                      <p style={{ fontSize: '13px', color: 'var(--outline)', fontStyle: 'italic' }}>
                        Nenhum atributo cadastrado para este produto.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Seção Promoções Ativas */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Promoções Ativas</h4>
                <div style={{ marginTop: '8px' }}>
                  {productPromotions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {productPromotions.map((promo) => (
                        <div key={promo.id} style={styles.activePromoCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={styles.promoPriceLabel}>Preço Promocional</span>
                              <div style={styles.promoPriceValue}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(promo.promotional_price)}
                              </div>
                            </div>
                            <span style={styles.activeBadge}>ATIVA</span>
                          </div>
                          <p style={styles.promoDurationText}>
                            Expira em: {new Date(promo.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditPromo(promo)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--outline-variant)',
                                backgroundColor: 'transparent',
                                color: 'var(--primary)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPromotion(promo.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(186, 26, 26, 0.2)',
                                backgroundColor: 'transparent',
                                color: 'var(--error)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cancel</span>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--outline)', fontStyle: 'italic' }}>
                      Este produto está sendo vendido pelo preço padrão ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.current_price)}).
                    </p>
                  )}
                </div>
              </div>

              {/* Formulário de Nova Promoção */}
              <div style={{ ...styles.modalSection, borderTop: '1px solid var(--surface-container-highest)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={styles.modalSectionTitle}>{editingPromoId ? 'Editar Campanha de Promoção' : 'Criar Nova Campanha de Promoção'}</h4>
                
                {promoFeedback && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: promoFeedback.includes('sucesso') ? 'rgba(26, 115, 18, 0.08)' : 'rgba(186, 26, 26, 0.08)',
                    color: promoFeedback.includes('sucesso') ? 'var(--tertiary)' : 'var(--error)',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    marginTop: '8px'
                  }}>
                    {promoFeedback}
                  </div>
                )}

                <form onSubmit={handleActivatePromotion} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  
                  {/* Tipo de Desconto */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPromoType('percent')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: promoType === 'percent' ? '1.5px solid var(--primary)' : '1px solid var(--outline-variant)',
                        backgroundColor: promoType === 'percent' ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                        color: promoType === 'percent' ? 'var(--primary)' : 'var(--on-surface-variant)',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Percentual (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoType('fixed')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: promoType === 'fixed' ? '1.5px solid var(--primary)' : '1px solid var(--outline-variant)',
                        backgroundColor: promoType === 'fixed' ? 'rgba(110, 0, 193, 0.05)' : 'transparent',
                        color: promoType === 'fixed' ? 'var(--primary)' : 'var(--on-surface-variant)',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Valor Fixo (R$)
                    </button>
                  </div>

                  {/* Valor do Desconto e Data Limite */}
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>
                        {promoType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder={promoType === 'percent' ? 'Ex: 10' : 'Ex: 5,00'}
                        value={promoValue}
                        onChange={(e) => setPromoValue(e.target.value)}
                        style={styles.formInput}
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Válido Até</label>
                      <input 
                        type="date"
                        value={promoEndDate}
                        onChange={(e) => setPromoEndDate(e.target.value)}
                        style={styles.formInput}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="submit" 
                      disabled={promoLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {promoLoading 
                        ? (editingPromoId ? 'Salvando...' : 'Ativando...') 
                        : (editingPromoId ? 'Salvar Alterações da Promoção' : 'Ativar Promoção na Vitrine')}
                    </button>
                    {editingPromoId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPromoId(null);
                          setPromoValue('');
                          setPromoEndDate('');
                        }}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--outline-variant)',
                          backgroundColor: 'transparent',
                          color: 'var(--on-surface-variant)',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>

                </form>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Estilos premium inline baseados fielmente no design e no mockup enviado
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--primary)',
    fontFamily: 'Plus Jakarta Sans',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: 'var(--on-surface-variant)',
    marginTop: '4px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricIconBg: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--on-surface)',
  },
  metricLabel: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  inventoryCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    overflow: 'hidden',
  },
  inventoryHeader: {
    padding: '24px',
    borderBottom: '1px solid var(--surface-container-highest)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  inventoryTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '320px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--on-surface-variant)',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    borderRadius: '9999px', // total rounded like screenshot search bar!
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    outline: 'none',
    color: 'var(--on-surface)',
    backgroundColor: 'transparent',
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
    backgroundColor: '#ffffff',
    borderBottom: '1px solid var(--surface-container-highest)',
  },
  th: {
    padding: '16px 24px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--outline)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid var(--surface-container-highest)',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '20px 24px',
    fontSize: '16px',
    verticalAlign: 'middle',
  },
  prodImg: {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  },
  prodDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  prodTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  prodId: {
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '9999px',
    backgroundColor: 'var(--surface-container)',
    color: 'var(--on-surface-variant)',
    fontSize: '13px',
    fontWeight: '600',
  },
  inputEditWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    width: '100px',
  },
  priceInput: {
    width: '80px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    color: 'var(--secondary)',
    outline: 'none',
    textAlign: 'center',
  },
  pencilIcon: {
    fontSize: '16px',
    color: 'var(--outline)',
    cursor: 'pointer',
  },
  stockWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stockInput: {
    width: '64px',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    color: 'var(--on-surface)',
    outline: 'none',
    textAlign: 'center',
  },
  stockUnit: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
  },
  statusActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 16px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    color: 'var(--tertiary)',
    fontSize: '13px',
    fontWeight: '700',
  },
  statusInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 16px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    fontSize: '13px',
    fontWeight: '700',
  },
  dotGreen: {
    color: 'var(--tertiary)',
    fontSize: '14px',
  },
  dotRed: {
    color: 'var(--error)',
    fontSize: '14px',
  },
  pauseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    color: 'var(--on-surface)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  },
  activateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'var(--primary-container)', // Solid purple capsule!
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  },
  tableFooter: {
    padding: '20px 24px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid var(--surface-container-highest)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  paginationBtns: {
    display: 'flex',
    gap: '8px',
  },
  pageBtnDisabled: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '8px',
    color: 'var(--surface-dim)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  pageBtnActive: {
    padding: '8px 16px',
    backgroundColor: 'var(--primary-container)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bottomFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid var(--surface-container-highest)',
  },
  verifiedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  verifiedText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
  },
  footerCopyright: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--on-surface-variant)',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '350px',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(110, 0, 193, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  skeletonText: {
    color: 'var(--on-surface-variant)',
    fontSize: '14px',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    border: '1px solid var(--error)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  inclusionCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(110, 0, 193, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    marginBottom: '8px',
  },
  inclusionForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
  },
  formInput: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: 'transparent',
    outline: 'none',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formSelect: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  inclusionBtn: {
    padding: '14px 20px',
    backgroundColor: 'var(--primary)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  feedbackInclusion: {
    padding: '12px 16px',
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    border: '1px solid var(--tertiary)',
    borderRadius: '8px',
    color: 'var(--tertiary)',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  fileUploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '20px',
    border: '2px dashed var(--outline-variant)',
    borderRadius: '12px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  detailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(110, 0, 193, 0.06)',
    color: 'var(--primary)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid var(--surface-container-highest)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalProductImg: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    marginBottom: '2px',
  },
  modalCloseBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    fontSize: '24px',
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metricsBoxRow: {
    display: 'flex',
    gap: '12px',
  },
  metricMiniCard: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--surface-container-highest)',
  },
  miniCardLabel: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniCardValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    marginTop: '2px',
  },
  modalSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  modalSectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  attributeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  attributeLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--outline)',
    minWidth: '70px',
  },
  attributeTag: {
    padding: '3px 10px',
    backgroundColor: 'rgba(110, 0, 193, 0.05)',
    color: 'var(--primary)',
    border: '1px solid rgba(110, 0, 193, 0.15)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  specItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 12px',
    backgroundColor: 'var(--surface-container-lowest)',
    border: '1px solid var(--surface-container-highest)',
    borderRadius: '6px',
    fontSize: '12px',
  },
  activePromoCard: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(254, 107, 0, 0.05)',
    border: '1px dashed #fe6b00',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  promoPriceLabel: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  promoPriceValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fe6b00',
  },
  promoDurationText: {
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
  },
  activeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: 'var(--tertiary)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  multiImagePreviewCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface-container-low)',
    position: 'relative',
  },
  multiImageThumbnail: {
    width: '100%',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  colorSelectMini: {
    width: '100%',
    padding: '4px 6px',
    borderRadius: '4px',
    border: '1px solid var(--outline-variant)',
    fontSize: '11px',
    backgroundColor: '#ffffff',
    color: 'var(--on-surface)',
    outline: 'none',
  },
  removeImageBtn: {
    width: '100%',
    marginTop: '6px',
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    color: 'var(--primary)',
    border: '1.5px solid var(--primary)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  miniFileUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 14px',
    border: '1px dashed var(--primary)',
    borderRadius: '8px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    color: 'var(--primary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '12px',
    fontWeight: '600',
    minHeight: '38px',
  },
  miniThumbnail: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid var(--outline-variant)',
  },
  superMiniThumbnail: {
    width: '18px',
    height: '18px',
    objectFit: 'cover',
    borderRadius: '4px',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  deleteMiniBtn: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};
