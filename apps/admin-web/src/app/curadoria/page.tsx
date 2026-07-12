'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces
interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string;
  original_price: number;
  current_price: number;
  images: string[];
  category: string;
  status: 'draft' | 'published' | 'rejected';
  is_featured: boolean;
  attributes: {
    sizes?: string[];
    colors?: Array<{ name: string; imageUrl?: string } | string>;
    additional?: { [key: string]: string };
    category_image?: string;
    curator_feedback?: string;
    image_mappings?: { [imageUrl: string]: string };
    [key: string]: any;
  };
  created_at: string;
  stores?: {
    name: string;
  };
  selectedImageId?: string;
}

interface ImageAsset {
  id: string;
  name: string;
  svgType: 'copaiba' | 'acai' | 'basket' | 'nuts' | 'soap';
}

export default function CuradoriaProdutosPage() {
  // Banco de imagens UÁRI pré-carregadas (SVGs de alta fidelidade como fallback)
  const imageAssets: ImageAsset[] = [
    { id: 'img-copaiba', name: 'Óleo de Copaíba Garrafa Premium', svgType: 'copaiba' },
    { id: 'img-acai', name: 'Tigela de Açaí com Bananas', svgType: 'acai' },
    { id: 'img-basket', name: 'Cesto Tucumã Tradicional G', svgType: 'basket' },
    { id: 'img-nuts', name: 'Castanhas Selecionadas Tigela', svgType: 'nuts' },
    { id: 'img-soap', name: 'Sabonete de Argila e Andiroba', svgType: 'soap' }
  ];

  // Estados principais
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Estados para pesquisa, filtro e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'draft', 'published', 'rejected'
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent'); // 'recent', 'price_asc', 'price_desc', 'alpha'

  // Estados de carregamento
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Estados auxiliares para edição de atributos na curadoria
  const [colorInput, setColorInput] = useState('');
  const [colorUrl, setColorUrl] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; type: 'product' | 'image'; targetUrl?: string } | null>(null);

  // Busca todos os produtos do Supabase
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          store_id,
          title,
          description,
          current_price,
          original_price,
          category,
          status,
          created_at,
          images,
          attributes,
          is_featured,
          stores (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Product[] = data.map((item: any) => {
          let defaultImgId = '';
          if (item.images && item.images.length > 0) {
            defaultImgId = item.images[0];
          }

          return {
            id: item.id,
            store_id: item.store_id,
            title: item.title,
            description: item.description || '',
            original_price: Number(item.original_price || (item.current_price * 1.25)),
            current_price: Number(item.current_price || 0),
            images: item.images || [],
            category: item.category || 'Regional',
            status: item.status || 'draft',
            is_featured: item.is_featured || false,
            attributes: {
              sizes: item.attributes?.sizes || [],
              colors: item.attributes?.colors || [],
              additional: item.attributes?.additional || {},
              category_image: item.attributes?.category_image || undefined,
              curator_feedback: item.attributes?.curator_feedback || undefined,
              image_mappings: item.attributes?.image_mappings || {}
            },
            created_at: item.created_at,
            stores: {
              name: item.stores?.name || 'Lojista local'
            },
            selectedImageId: item.attributes?.selectedImageId || defaultImgId
          };
        });

        setProducts(mapped);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos do Supabase:', err);
      showNotification('Erro ao carregar catálogo de produtos do Supabase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados na montagem do componente
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Seleciona automaticamente o primeiro produto da lista filtrada se o atual não for mais visível
  const activeProduct = products.find(p => p.id === selectedProductId) || null;

  // Notificações
  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Atualizar campos do produto ativo localmente
  const updateActiveField = (field: keyof Product, value: any) => {
    if (!selectedProductId) return;
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProductId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Atualizar campos dentro do objeto attributes do produto ativo
  const updateActiveAttribute = (attrKey: string, value: any) => {
    if (!activeProduct) return;
    updateActiveField('attributes', {
      ...activeProduct.attributes,
      [attrKey]: value
    });
  };

  // Upload de imagem do produto para o Supabase Storage
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProduct) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeProduct.store_id}/${Date.now()}.${fileExt}`;

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

      const updatedImages = [...(activeProduct.images || []), publicUrl];
      updateActiveField('images', updatedImages);

      // Define como capa se nenhuma capa real estiver definida
      if (!activeProduct.selectedImageId || activeProduct.selectedImageId.startsWith('img-')) {
        updateActiveField('selectedImageId', publicUrl);
      }

      showNotification('Imagem carregada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro no upload de imagem:', err);
      showNotification('Erro ao carregar imagem para o storage.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Upload de imagem da categoria para o Supabase Storage
  const handleUploadCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProduct) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeProduct.store_id}/category_${Date.now()}.${fileExt}`;

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

      updateActiveAttribute('category_image', publicUrl);
      showNotification('Imagem de destaque da categoria carregada!', 'success');
    } catch (err) {
      console.error('Erro no upload de imagem de categoria:', err);
      showNotification('Erro ao carregar imagem da categoria.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Alternar ou adicionar categoria na listagem múltipla
  const handleToggleCategory = (catName: string) => {
    if (!activeProduct) return;
    const currentCats = activeProduct.category 
      ? activeProduct.category.split(',').map(c => c.trim()).filter(Boolean) 
      : [];
    
    let newCats;
    if (currentCats.includes(catName)) {
      newCats = currentCats.filter(c => c !== catName);
    } else {
      newCats = [...currentCats, catName];
    }
    updateActiveField('category', newCats.join(', '));
  };

  // Adicionar categoria livre customizada
  const handleAddCustomCategory = () => {
    if (!customCategoryInput.trim() || !activeProduct) return;
    const newCat = customCategoryInput.trim();
    const currentCats = activeProduct.category 
      ? activeProduct.category.split(',').map(c => c.trim()).filter(Boolean) 
      : [];

    if (!currentCats.includes(newCat)) {
      const newCats = [...currentCats, newCat];
      updateActiveField('category', newCats.join(', '));
    }
    setCustomCategoryInput('');
  };

  // Excluir produto e limpar mídias associadas do storage (chamado pelo modal de confirmação)
  const handleDeleteProductConfirm = async () => {
    if (!activeProduct) return;

    setSaving(true);
    try {
      const imagesToDelete = activeProduct.images || [];
      const pathsToDelete: string[] = [];

      imagesToDelete.forEach(url => {
        if (url.includes('/storage/v1/object/public/products/')) {
          const path = url.split('/storage/v1/object/public/products/')[1];
          if (path) {
            pathsToDelete.push(path);
          }
        }
      });

      if (activeProduct.attributes?.category_image && activeProduct.attributes.category_image.includes('/storage/v1/object/public/products/')) {
        const catPath = activeProduct.attributes.category_image.split('/storage/v1/object/public/products/')[1];
        if (catPath) {
          pathsToDelete.push(catPath);
        }
      }

      // 1. Apaga do Storage
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('products')
          .remove(pathsToDelete);
        if (storageError) {
          console.error('Erro ao deletar arquivos de mídia do Storage:', storageError);
        }
      }

      // 2. Apaga da tabela no banco
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', activeProduct.id);

      if (dbError) throw dbError;

      showNotification(`Produto "${activeProduct.title}" excluído com sucesso!`, 'success');
      setSelectedProductId(null);
      await fetchAllProducts();
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      showNotification('Erro ao excluir produto do banco de dados.', 'error');
    } finally {
      setSaving(false);
      setDeleteConfirmModal(null);
    }
  };

  // Excluir imagem definitivamente do banco e do storage (chamado pelo modal de confirmação)
  const handleDeleteImageConfirm = async (url: string) => {
    if (!activeProduct || !url) return;

    try {
      // 1. Tentar deletar física no Supabase Storage
      if (url.includes('/storage/v1/object/public/products/')) {
        const path = url.split('/storage/v1/object/public/products/')[1];
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove([path]);
          if (storageError) {
            console.error('Erro ao apagar arquivo no Storage:', storageError);
          }
        }
      }

      // 2. Atualizar arrays locais no React
      const updatedImages = (activeProduct.images || []).filter(img => img !== url);
      updateActiveField('images', updatedImages);

      // Limpar mapeamento de cor desta imagem se existir
      const updatedMappings = { ...(activeProduct.attributes?.image_mappings || {}) };
      delete updatedMappings[url];
      updateActiveAttribute('image_mappings', updatedMappings);

      if (activeProduct.selectedImageId === url) {
        updateActiveField('selectedImageId', updatedImages.length > 0 ? updatedImages[0] : '');
      }

      // 3. Atualizar no banco de dados Supabase imediatamente se o produto existir
      const { error: dbError } = await supabase
        .from('products')
        .update({ 
          images: updatedImages,
          attributes: {
            ...activeProduct.attributes,
            image_mappings: updatedMappings,
            selectedImageId: activeProduct.selectedImageId === url ? (updatedImages.length > 0 ? updatedImages[0] : '') : activeProduct.selectedImageId
          }
        })
        .eq('id', activeProduct.id);

      if (dbError) throw dbError;

      // Sincronizar na lista geral
      setProducts(prev => prev.map(p => {
        if (p.id === activeProduct.id) {
          return {
            ...p,
            images: updatedImages,
            selectedImageId: p.selectedImageId === url ? (updatedImages.length > 0 ? updatedImages[0] : '') : p.selectedImageId,
            attributes: {
              ...p.attributes,
              image_mappings: updatedMappings
            }
          };
        }
        return p;
      }));

      showNotification('Imagem excluída fisicamente do storage e limpa da base de dados!', 'success');
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      showNotification('Erro ao processar exclusão da imagem no banco de dados.', 'error');
    } finally {
      setDeleteConfirmModal(null);
    }
  };

  // Funções para manipular Atributos
  const handleToggleSize = (size: string) => {
    if (!activeProduct) return;
    const currentSizes = activeProduct.attributes?.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    updateActiveAttribute('sizes', newSizes);
  };

  const handleAddColor = () => {
    if (!activeProduct || !colorInput.trim()) return;
    const currentColors = activeProduct.attributes?.colors || [];
    
    // Verifica duplicado
    if (currentColors.some(c => (typeof c === 'string' ? c : c.name) === colorInput.trim())) return;

    const newColors = [...currentColors, { name: colorInput.trim(), imageUrl: colorUrl.trim() || undefined }];
    updateActiveAttribute('colors', newColors);
    
    setColorInput('');
    setColorUrl('');
  };

  const handleRemoveColor = (name: string) => {
    if (!activeProduct) return;
    const currentColors = activeProduct.attributes?.colors || [];
    const newColors = currentColors.filter(c => (typeof c === 'string' ? c : c.name) !== name);
    updateActiveAttribute('colors', newColors);
  };

  const handleAddSpec = () => {
    if (!activeProduct || !specKey.trim() || !specVal.trim()) return;
    const currentSpecs = activeProduct.attributes?.additional || {};
    const newSpecs = { ...currentSpecs, [specKey.trim()]: specVal.trim() };
    updateActiveAttribute('additional', newSpecs);

    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (key: string) => {
    if (!activeProduct) return;
    const currentSpecs = { ...(activeProduct.attributes?.additional || {}) };
    delete currentSpecs[key];
    updateActiveAttribute('additional', currentSpecs);
  };

  // Ação de Salvar Alterações (mantém o status atual)
  const handleSaveProduct = async (e: React.FormEvent, forceStatus?: 'draft' | 'published' | 'rejected', feedbackText?: string) => {
    if (e) e.preventDefault();
    if (!activeProduct) return;

    setSaving(true);
    try {
      const finalStatus = forceStatus || activeProduct.status;
      const coverImg = activeProduct.selectedImageId || '';
      
      // Ordena array de imagens para a capa ficar em primeiro
      let finalImages = [...(activeProduct.images || [])];
      if (coverImg && finalImages.includes(coverImg)) {
        finalImages = [coverImg, ...finalImages.filter(img => img !== coverImg)];
      }

      // Agrupa atributos finais
      const finalAttributes = {
        ...(activeProduct.attributes || {}),
        selectedImageId: coverImg,
      };

      if (feedbackText !== undefined) {
        finalAttributes.curator_feedback = feedbackText;
      }

      const { error } = await supabase
        .from('products')
        .update({
          title: activeProduct.title,
          description: activeProduct.description,
          current_price: activeProduct.current_price,
          original_price: activeProduct.original_price,
          category: activeProduct.category,
          is_featured: activeProduct.is_featured,
          status: finalStatus,
          images: finalImages,
          attributes: finalAttributes
        })
        .eq('id', activeProduct.id);

      if (error) throw error;

      showNotification(`Produto "${activeProduct.title}" salvo com sucesso!`, 'success');
      
      // Recarrega todos os produtos
      await fetchAllProducts();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      showNotification('Erro ao salvar informações do produto no Supabase.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Ação de Aprovar e Publicar (Ativar Venda)
  const handleApproveAndPublish = async () => {
    if (!activeProduct) return;
    await handleSaveProduct(null as any, 'published');
    showNotification(`🎉 Produto "${activeProduct.title}" foi ativado e publicado na vitrine!`, 'success');
  };

  // Ação de Pausar Venda (Voltar para Rascunho)
  const handlePauseSale = async () => {
    if (!activeProduct) return;
    await handleSaveProduct(null as any, 'draft');
    showNotification(`⏸️ Venda do produto "${activeProduct.title}" foi pausada (Rascunho).`, 'info');
  };

  // Ação de Rejeitar / Solicitar Ajustes
  const handleRejectWithFeedback = async () => {
    if (!activeProduct) return;
    const comment = prompt(`Informe as correções que o lojista precisa fazer no produto "${activeProduct.title}":`, 'Revisar a descrição comercial e as fotos anexadas.');
    if (comment === null) return; // Cancelado pelo admin

    await handleSaveProduct(null as any, 'rejected', comment);
    showNotification(`⚠️ Proposta recusada. Ajustes solicitados ao lojista.`, 'info');
  };

  // Extrai dinamicamente todas as categorias únicas do banco para listagem rápida (quebrando categorias múltiplas)
  const uniqueCategoriesInDB = Array.from(
    new Set(
      products
        .flatMap(p => (p.category || '').split(','))
        .map(c => c.trim())
        .filter(Boolean)
    )
  );
  
  // Categorias padrão recomendadas
  const defaultCategories = ['Alimentos', 'Artesanato', 'Regional', 'Moda', 'Cosméticos'];

  // Combina as categorias em uma lista unificada para o preenchimento rápido
  const allCategoriesForQuickSelect = Array.from(new Set([...defaultCategories, ...uniqueCategoriesInDB]));

  // Aplica filtros, pesquisa e ordenamento na listagem lateral
  const filteredProducts = products.filter(prod => {
    const matchesSearch = 
      prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.stores?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ? true : prod.status === statusFilter;
    
    // Verifica se a categoria filtrada está contida na lista de categorias do produto
    const productCategoriesList = (prod.category || '').split(',').map(c => c.trim()).filter(Boolean);
    const matchesCategory = categoryFilter === 'all' ? true : productCategoriesList.includes(categoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'price_asc') {
      return a.current_price - b.current_price;
    }
    if (sortBy === 'price_desc') {
      return b.current_price - a.current_price;
    }
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Renderizador das ilustrações vetoriais em SVG
  const renderProductIllustration = (svgType: string, width = 110, height = 110, style = {}) => {
    if (svgType === 'copaiba') {
      return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.illustrationSvg, ...style }}>
          <rect width="100" height="100" rx="12" fill="#E8F5E9" />
          <path d="M42 35H58V80H42V35Z" fill="#795548" />
          <path d="M45 35V25H55V35H45Z" fill="#3E2723" />
          <path d="M50 15V25" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <path d="M46 15H54" stroke="#212121" strokeWidth="2" />
          <circle cx="50" cy="11" r="3" fill="#D32F2F" />
          <rect x="44" y="45" width="12" height="24" rx="1" fill="#FFF9C4" />
          <line x1="46" y1="50" x2="54" y2="50" stroke="#8D6E63" strokeWidth="2" />
          <line x1="46" y1="56" x2="54" y2="56" stroke="#8D6E63" strokeWidth="1" />
          <path d="M62 45C66 45 68 49 68 53C68 57 64 61 62 61C60 61 56 57 56 53C56 49 58 45 62 45Z" fill="#4CAF50" />
          <path d="M62 45V61" stroke="#2E7D32" strokeWidth="1" />
        </svg>
      );
    }
    if (svgType === 'acai') {
      return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.illustrationSvg, ...style }}>
          <rect width="100" height="100" rx="12" fill="#F3E5F5" />
          <path d="M20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50H20Z" fill="#4A148C" />
          <ellipse cx="50" cy="50" rx="30" ry="12" fill="#311B92" />
          <circle cx="36" cy="46" r="5" fill="#FFF59D" />
          <circle cx="36" cy="46" r="2" fill="#FFFDE7" />
          <circle cx="48" cy="48" r="5" fill="#FFF59D" />
          <circle cx="48" cy="48" r="2" fill="#FFFDE7" />
          <circle cx="62" cy="47" r="1.5" fill="#FFB74D" />
          <circle cx="58" cy="52" r="1.5" fill="#FFB74D" />
          <circle cx="66" cy="51" r="1.5" fill="#FFB74D" />
          <path d="M72 32L62 45L66 49L76 36L72 32Z" fill="#B0BEC5" />
          <circle cx="76" cy="32" r="4" fill="#CFD8DC" />
        </svg>
      );
    }
    if (svgType === 'basket') {
      return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.illustrationSvg, ...style }}>
          <rect width="100" height="100" rx="12" fill="#EFEBE9" />
          <path d="M25 45L30 75C30.5 78 33 80 36 80H64C67 80 69.5 78 70 75L75 45H25Z" fill="#D7CCC8" />
          <path d="M22 45C22 42.2386 24.2386 40 27 40H73C75.7614 40 78 42.2386 78 45H22Z" fill="#A1887F" />
          <path d="M32 50L38 60L44 50L50 60L56 50L62 60L68 50" stroke="#FF5722" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 65L40 73L46 65L52 73L58 65L64 73" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 40C30 32 36 28 42 28" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
          <path d="M70 40C70 32 64 28 58 28" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    }
    if (svgType === 'nuts') {
      return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.illustrationSvg, ...style }}>
          <rect width="100" height="100" rx="12" fill="#FFF3E0" />
          <ellipse cx="50" cy="65" rx="35" ry="18" fill="#8D6E63" />
          <ellipse cx="50" cy="60" rx="32" ry="14" fill="#A1887F" />
          <path d="M38 56C34 56 31 52 35 46C39 40 45 42 45 48C45 54 42 56 38 56Z" fill="#D7CCC8" />
          <path d="M38 56C36 56 35 55 36 52C37 49 39 47 41 48" stroke="#5D4037" strokeWidth="1" />
          <path d="M52 52C48 52 45 47 49 42C53 37 59 39 59 44C59 49 56 52 52 52Z" fill="#D7CCC8" />
          <path d="M52 52C50 52 49 51 50 48C51 45 53 43 55 44" stroke="#5D4037" strokeWidth="1" />
          <path d="M64 58C60 58 58 53 62 48C66 43 72 45 72 50C72 55 68 58 64 58Z" fill="#E0D7D3" />
        </svg>
      );
    }
    // Soap
    return (
      <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.illustrationSvg, ...style }}>
        <rect width="100" height="100" rx="12" fill="#ECEFF1" />
        <path d="M25 40L35 30H70L60 40H25Z" fill="#90A4AE" />
        <rect x="25" y="40" width="35" height="25" rx="2" fill="#78909C" />
        <path d="M60 40L70 30V55L60 65V40Z" fill="#546E7A" />
        <ellipse cx="42" cy="52" rx="8" ry="4" fill="#CFD8DC" opacity="0.3" />
        <path d="M38 52H46" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="72" cy="24" r="4" fill="#ffffff" fillOpacity="0.4" stroke="#B0BEC5" strokeWidth="1" />
        <circle cx="78" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.4" stroke="#B0BEC5" strokeWidth="1" />
        <circle cx="66" cy="38" r="1.5" fill="#ffffff" fillOpacity="0.4" stroke="#B0BEC5" strokeWidth="1" />
      </svg>
    );
  };

  return (
    <div style={styles.container}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          ...styles.toast,
          backgroundColor: notification.type === 'success' 
            ? '#2e7d32' 
            : notification.type === 'error' 
              ? 'var(--error)' 
              : 'var(--primary)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header */}
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Curadoria de Produtos da Vitrine</h1>
          <p style={styles.pageSubtitle}>Homologação, enriquecimento e controle de status dos produtos no UÁRI Marketplace.</p>
        </div>
      </section>

      {/* Bento Grid KPIs */}
      <section style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Aguardando Homologação</span>
          <div style={{ ...styles.metricValue, color: '#f57c00' }}>
            {products.filter(p => p.status === 'draft').length.toString().padStart(2, '0')} Pendentes
          </div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Produtos Ativos na Vitrine</span>
          <div style={{ ...styles.metricValue, color: '#2e7d32' }}>
            {products.filter(p => p.status === 'published').length.toString()} Itens
          </div>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total de Produtos</span>
          <div style={{ ...styles.metricValue, color: 'var(--primary)' }}>
            {products.length.toString()} Cadastrados
          </div>
        </div>
      </section>

      {/* Main Layout Grid: Catálogo de Produtos e Editor Lateral */}
      <div style={styles.mainWorkspaceGrid}>
        
        {/* Lado Esquerdo: Lista de Produtos com Busca, Filtros e Ordenamento */}
        <div style={styles.leftQueueColumn}>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={styles.cardSectionTitle}>Catálogo de Produtos</h2>
              <span style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '700' }}>
                {filteredProducts.length} encontrados
              </span>
            </div>

            {/* Caixa de Busca */}
            <div style={styles.searchContainer}>
              <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
              <input 
                type="text" 
                placeholder="Buscar por título, loja ou categoria..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Painel de Filtros */}
            <div style={styles.filterSection}>
              {/* Filtro de Status - Tabs */}
              <div style={styles.filterTabContainer}>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'draft', label: 'Pendentes' },
                  { id: 'published', label: 'Ativos' },
                  { id: 'rejected', label: 'Recusados' }
                ].map(tab => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        ...styles.filterTabButton,
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
                        color: isActive ? '#ffffff' : 'var(--on-surface-variant)',
                        fontWeight: isActive ? '800' : '600'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Filtro de Categoria e Ordenamento */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ ...styles.fieldSelect, padding: '6px 10px', fontSize: '12px', flex: 1 }}
                >
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategoriesInDB.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ ...styles.fieldSelect, padding: '6px 10px', fontSize: '12px', flex: 1 }}
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Preço: Menor → Maior</option>
                  <option value="price_desc">Preço: Maior → Menor</option>
                  <option value="alpha">Ordem Alfabética (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Lista de Itens */}
            <div style={styles.queueList}>
              {loading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--outline)' }}>
                  Carregando catálogo de produtos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={styles.emptyQueueState}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--outline)' }}>search_off</span>
                  <span style={{ fontWeight: '750', fontSize: '13px' }}>Nenhum produto encontrado</span>
                  <span style={{ fontSize: '11px', color: 'var(--outline)', textAlign: 'center' }}>Refine os termos de busca ou mude os filtros aplicados.</span>
                </div>
              ) : (
                filteredProducts.map(prod => {
                  const isActive = prod.id === selectedProductId;
                  const coverImage = prod.selectedImageId || (prod.images && prod.images.length > 0 ? prod.images[0] : '');
                  const isSvg = coverImage && coverImage.startsWith('img-');
                  
                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => setSelectedProductId(prod.id)}
                      style={{
                        ...styles.queueItemCard,
                        borderColor: isActive ? 'var(--primary)' : 'var(--outline-variant)',
                        backgroundColor: isActive ? 'rgba(110, 0, 193, 0.03)' : '#ffffff',
                        boxShadow: isActive ? '0px 4px 12px rgba(110,0,193,0.06)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Thumbnail com Fallback de Logo padrão */}
                        <div style={{ flexShrink: 0 }}>
                          {isSvg ? (
                            renderProductIllustration(coverImage.replace('img-', ''), 54, 54, { borderRadius: '6px' })
                          ) : coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={coverImage} 
                              alt={prod.title} 
                              style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--outline-variant)' }} 
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src="/logo.png" 
                              alt="Uári Logo Fallback" 
                              style={{ width: '54px', height: '54px', objectFit: 'contain', padding: '6px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-high)' }} 
                            />
                          )}
                        </div>

                        {/* Detalhes do Card */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.queueItemHeader}>
                            <span style={styles.queueStoreName}>{prod.stores?.name}</span>
                            <span style={{
                              ...styles.statusIndicatorBadge,
                              backgroundColor: prod.status === 'published' 
                                ? 'rgba(46, 125, 50, 0.08)' 
                                : prod.status === 'rejected' 
                                  ? 'rgba(186, 26, 26, 0.08)' 
                                  : 'rgba(245, 124, 0, 0.08)',
                              color: prod.status === 'published' 
                                ? '#2e7d32' 
                                : prod.status === 'rejected' 
                                  ? 'var(--error)' 
                                  : '#f57c00'
                            }}>
                              {prod.status === 'published' ? 'Ativo' : prod.status === 'rejected' ? 'Ajustes' : 'Pendente'}
                            </span>
                          </div>

                          <h3 style={{ ...styles.queueProductTitle, fontSize: '13px', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {prod.title}
                          </h3>

                          <div style={styles.queueItemFooter}>
                            {/* Múltiplas categorias na listagem lateral */}
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '65%' }}>
                              {(prod.category || '').split(',').map(c => c.trim()).filter(Boolean).map((cat, cIdx) => (
                                <span key={cIdx} style={{ ...styles.queueCategoryTag, fontSize: '9px', padding: '2px 6px' }}>{cat}</span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {prod.is_featured && (
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fbc02d' }}>star</span>
                              )}
                              <span style={{ ...styles.queuePriceText, fontSize: '13px' }}>
                                R$ {prod.current_price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Lado Direito: Editor de Enriquecimento e Validação (Curadoria) */}
        <div style={styles.rightEditorColumn}>
          {activeProduct ? (
            <form onSubmit={(e) => handleSaveProduct(e)} style={styles.card}>
              
              {/* Header do Editor */}
              <div style={styles.editorHeaderRow}>
                <div>
                  <span style={styles.editorPreTitle}>VALIDAÇÃO & HOMOLOGAÇÃO DE DADOS</span>
                  <h2 style={styles.editorMainTitle}>Ficha Técnica da Vitrine</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={styles.editorStoreTag}>{activeProduct.stores?.name}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: activeProduct.status === 'published' ? '#2e7d32' : activeProduct.status === 'rejected' ? 'var(--error)' : '#f57c00'
                  }}>
                    Status atual: {activeProduct.status === 'published' ? 'Venda Ativa' : activeProduct.status === 'rejected' ? 'Rejeitado (Corrigir)' : 'Aguardando Aprovação'}
                  </span>
                </div>
              </div>

              {/* Alerta de Feedback se o produto foi Recusado */}
              {activeProduct.status === 'rejected' && activeProduct.attributes?.curator_feedback && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(186, 26, 26, 0.05)',
                  border: '1px solid rgba(186, 26, 26, 0.15)',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '20px' }}>warning</span>
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--error)', display: 'block' }}>Ajustes Solicitados pelo Curador:</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                      &quot;{activeProduct.attributes.curator_feedback}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Informações Básicas do Produto */}
              <div style={styles.editorSection}>
                <h3 style={styles.editorSectionTitle}>1. Informações Principais</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Nome do Produto (Título)</label>
                  <input 
                    type="text" 
                    value={activeProduct.title}
                    onChange={(e) => updateActiveField('title', e.target.value)}
                    style={styles.fieldInput}
                    required
                  />
                  <span style={styles.fieldHelp}>Escreva um título comercial atraente e claro para o comprador virtual.</span>
                </div>

                {/* Seção Categoria com Múltiplas Categorias (Chips + Input) */}
                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Categorias do Produto (Selecione quantas quiser)</label>
                  
                  {/* Categorias Ativas Atuais */}
                  {(() => {
                    const selectedCats = activeProduct.category 
                      ? activeProduct.category.split(',').map(c => c.trim()).filter(Boolean) 
                      : [];
                    return (
                      <>
                        {selectedCats.length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                            marginBottom: '10px',
                            border: '1px solid var(--outline-variant)',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--surface-container-low)'
                          }}>
                            {selectedCats.map(cat => (
                              <span
                                key={cat}
                                style={{
                                  ...styles.categoryBadge,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  backgroundColor: 'var(--primary)',
                                  color: '#ffffff',
                                  padding: '4px 12px',
                                  borderRadius: '9999px',
                                  fontSize: '11px',
                                  fontWeight: '750',
                                }}
                              >
                                {cat}
                                <span
                                  onClick={() => handleToggleCategory(cat)}
                                  className="material-symbols-outlined"
                                  style={{ fontSize: '14px', cursor: 'pointer', fontWeight: '800' }}
                                >
                                  close
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Adicionar nova categoria personalizada..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                      style={{ ...styles.fieldInput, flex: 1.5 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                      <span>Incluir</span>
                    </button>
                  </div>
                  
                  {/* Seletor rápido de Categorias Existentes na Base */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleToggleCategory(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={styles.fieldSelect}
                  >
                    <option value="">Alternar Categoria Existente...</option>
                    {allCategoriesForQuickSelect.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Chips Rápidos de Categorias Sugeridas */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '750', width: '100%', marginBottom: '2px' }}>
                      Sugestões (Clique para ativar/desativar):
                    </span>
                    {defaultCategories.map(cat => {
                      const selectedCats = activeProduct.category 
                        ? activeProduct.category.split(',').map(c => c.trim()).filter(Boolean) 
                        : [];
                      const isSelected = selectedCats.includes(cat);
                      return (
                        <span
                          key={cat}
                          onClick={() => handleToggleCategory(cat)}
                          style={{
                            ...styles.categoryBadge,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-container-high)',
                            color: isSelected ? '#ffffff' : 'var(--on-surface-variant)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {cat}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Preços e Destaque */}
                <div style={styles.rowFormFields}>
                  <div style={{ ...styles.formGroup, flex: '1' }}>
                    <label style={styles.fieldLabel}>Preço de Venda (R$)</label>
                    <div style={styles.priceInputBox}>
                      <span style={styles.pricePrefix}>R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={activeProduct.current_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateActiveField('current_price', val);
                          if (!activeProduct.original_price || activeProduct.original_price <= val) {
                            updateActiveField('original_price', Number((val * 1.25).toFixed(2)));
                          }
                        }}
                        style={styles.priceInputField}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.formGroup, flex: '1' }}>
                    <label style={styles.fieldLabel}>Preço Comparativo/Original (R$)</label>
                    <div style={styles.priceInputBox}>
                      <span style={styles.pricePrefix}>R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={activeProduct.original_price}
                        onChange={(e) => updateActiveField('original_price', parseFloat(e.target.value) || 0)}
                        style={styles.priceInputField}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox"
                    id="curator-is-featured"
                    checked={activeProduct.is_featured}
                    onChange={(e) => updateActiveField('is_featured', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="curator-is-featured" style={{ ...styles.fieldLabel, cursor: 'pointer', marginBottom: 0 }}>
                    Destacar este produto no topo da Vitrine (Destaque Principal)
                  </label>
                </div>

                {/* Upload de Imagem de Destaque da Categoria */}
                <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                  <label style={styles.fieldLabel}>Foto de Destaque da Categoria (Opcional)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {activeProduct.attributes?.category_image ? (
                      <div style={{ position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={activeProduct.attributes.category_image} 
                          alt="Destaque da Categoria" 
                          style={styles.miniThumbnail} 
                        />
                        <button
                          type="button"
                          onClick={() => updateActiveAttribute('category_image', undefined)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--error)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--outline)', fontStyle: 'italic' }}>
                        Nenhuma imagem de destaque configurada.
                      </div>
                    )}
                    
                    <label style={styles.miniFileUploadLabel} htmlFor="category-image-upload">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cloud_upload</span>
                      <span>{activeProduct.attributes?.category_image ? 'Alterar Imagem' : 'Upload Imagem'}</span>
                    </label>
                    <input 
                      type="file" 
                      id="category-image-upload" 
                      accept="image/*"
                      onChange={handleUploadCategoryImage}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Descrição Comercial Detalhada</label>
                  <textarea 
                    value={activeProduct.description}
                    onChange={(e) => updateActiveField('description', e.target.value)}
                    style={styles.fieldTextarea}
                    rows={4}
                    required
                  />
                  <span style={styles.fieldHelp}>Detalhes sobre origem local, benefícios regionais, modo de consumo ou artesanato.</span>
                </div>
              </div>

              {/* Seção 2: Imagens do Produto (Gerenciamento e Limpeza Física) */}
              <div style={styles.editorSection}>
                <div style={styles.imageSectionHeader}>
                  <div>
                    <h3 style={styles.editorSectionTitle}>2. Fotos Oficiais & Capa</h3>
                    <p style={styles.imageSectionDesc}>
                      Clique na foto para defini-la como Capa na Vitrine. Use a lixeira para excluir fisicamente o arquivo do servidor.
                    </p>
                  </div>
                </div>

                {/* Grid de Fotos Reais */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  {activeProduct.images && activeProduct.images.length > 0 ? (
                    activeProduct.images.map((url, idx) => {
                      const isSelectedCover = url === activeProduct.selectedImageId;
                      const isStorageUrl = url.includes('/storage/v1/object/public/products/');

                      return (
                        <div 
                          key={idx}
                          style={{
                            ...styles.imageAssetCard,
                            borderColor: isSelectedCover ? 'var(--primary)' : 'var(--outline-variant)',
                            backgroundColor: isSelectedCover ? 'rgba(110,0,193,0.02)' : 'transparent',
                            padding: '6px',
                            width: '120px',
                            minHeight: '120px',
                          }}
                        >
                          {/* Imagem em si */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={url} 
                            alt={`Produto ${idx}`} 
                            onClick={() => updateActiveField('selectedImageId', url)}
                            style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }} 
                          />

                          {/* Botão de Excluir Imagem Definitivamente (Limpeza de Base) */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmModal({ isOpen: true, type: 'image', targetUrl: url })}
                            title={isStorageUrl ? 'Excluir definitivamente do Storage e Banco' : 'Remover link do produto'}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid var(--outline-variant)',
                              borderRadius: '4px',
                              padding: '2px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--error)'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                          </button>

                          <span style={{ fontSize: '9px', color: 'var(--outline)', fontWeight: '700', textAlign: 'center', marginTop: '2px' }}>
                            {isSelectedCover ? 'Capa Principal' : 'Imagem'}
                          </span>

                          {isSelectedCover && (
                            <div style={styles.assetCheckedCircle}>
                              <span className="material-symbols-outlined" style={{ fontSize: '11px', color: '#ffffff' }}>check</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: '24px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      border: '1px dashed var(--outline-variant)',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: 'var(--outline)',
                      width: '100%',
                    }}>
                      Nenhuma imagem anexada. Faça upload de foto ao lado ou selecione um ativo vetorial como capa.
                    </div>
                  )}

                  {/* Upload Box de Nova Imagem */}
                  <label 
                    htmlFor="curator-new-image-upload" 
                    style={{
                      ...styles.imageAssetCard,
                      border: '1px dashed var(--primary)',
                      backgroundColor: 'rgba(110,0,193,0.02)',
                      width: '120px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>cloud_upload</span>
                      <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '800' }}>Adicionar Foto</span>
                    </div>
                  </label>
                  <input 
                    type="file" 
                    id="curator-new-image-upload" 
                    accept="image/*"
                    onChange={handleUploadImage}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </div>

                {/* Ilustrações Vetoriais de Fallback */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--outline)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Ativos Vetoriais / Ilustrações UÁRI Fallback
                  </span>
                  <div style={styles.imageAssetsGrid}>
                    {imageAssets.map(img => {
                      const isSelected = img.id === activeProduct.selectedImageId;
                      return (
                        <div 
                          key={img.id}
                          onClick={() => updateActiveField('selectedImageId', img.id)}
                          style={{
                            ...styles.imageAssetCard,
                            borderColor: isSelected ? 'var(--primary)' : 'var(--outline-variant)',
                            backgroundColor: isSelected ? 'rgba(110,0,193,0.02)' : 'transparent',
                          }}
                        >
                          {renderProductIllustration(img.svgType, 50, 50, { margin: '0 auto' })}
                          <span style={{
                            ...styles.imageAssetLabel,
                            color: isSelected ? 'var(--primary)' : 'var(--on-surface-variant)',
                            fontWeight: isSelected ? '800' : '600'
                          }}>
                            {img.name.split(' ')[0]}
                          </span>
                          {isSelected && (
                            <div style={styles.assetCheckedCircle}>
                              <span className="material-symbols-outlined" style={{ fontSize: '11px', color: '#ffffff' }}>check</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seção 3: Atributos / Ficha Técnica */}
              <div style={styles.editorSection}>
                <h3 style={styles.editorSectionTitle}>3. Variações & Ficha Técnica</h3>
                <p style={styles.imageSectionDesc}>Adicione ou remova tamanhos, cores ou especificações para exibição na vitrine.</p>

                {/* Grade de Tamanhos */}
                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Tamanhos Disponíveis</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['P', 'M', 'G', 'GG', 'Único'].map((size) => {
                      const active = (activeProduct.attributes?.sizes || []).includes(size);
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
                            fontWeight: '750',
                            fontSize: '12px',
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

                {/* Adicionar Cores */}
                <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                  <label style={styles.fieldLabel}>Cores & Swatches</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ex: Verde Oliva"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      style={{ ...styles.fieldInput, flex: 2 }}
                    />
                    <input
                      type="text"
                      placeholder="URL da Imagem (opcional)"
                      value={colorUrl}
                      onChange={(e) => setColorUrl(e.target.value)}
                      style={{ ...styles.fieldInput, flex: 1.5 }}
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
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      + Cor
                    </button>
                  </div>

                  {/* Listagem de Cores Adicionadas */}
                  {(activeProduct.attributes?.colors || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {(activeProduct.attributes.colors || []).map((c: any) => {
                        const name = typeof c === 'string' ? c : c.name;
                        const url = typeof c === 'object' ? c.imageUrl : null;
                        return (
                          <span
                            key={name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              backgroundColor: 'var(--surface-container-high)',
                              border: '1px solid var(--outline-variant)',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--on-surface)',
                            }}
                          >
                            {url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt={name} style={styles.superMiniThumbnail} />
                            )}
                            {name}
                            <span
                              onClick={() => handleRemoveColor(name)}
                              className="material-symbols-outlined"
                              style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              close
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Especificações Adicionais */}
                <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                  <label style={styles.fieldLabel}>Especificações Técnicas Customizadas</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Chave (Ex: Peso)"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      style={{ ...styles.fieldInput, flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Valor (Ex: 500g)"
                      value={specVal}
                      onChange={(e) => setSpecVal(e.target.value)}
                      style={{ ...styles.fieldInput, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--surface-container-high)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: '8px',
                        color: 'var(--on-surface)',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      + Info
                    </button>
                  </div>

                  {/* Listagem de Especificações */}
                  {activeProduct.attributes?.additional && Object.keys(activeProduct.attributes.additional).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      {Object.entries(activeProduct.attributes.additional).map(([key, val]: [string, any]) => (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 12px',
                            backgroundColor: 'var(--surface-container-low)',
                            border: '1px solid var(--surface-container-highest)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        >
                          <span>
                            <strong>{key}:</strong> {typeof val === 'object' && val !== null ? val.value : val}
                          </span>
                          <span
                            onClick={() => handleRemoveSpec(key)}
                            className="material-symbols-outlined"
                            style={{ fontSize: '15px', cursor: 'pointer', color: 'var(--error)' }}
                          >
                            delete
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação do Editor de Curadoria */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Botão de Salvar Alterações (Salva sem alterar status) */}
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{
                      ...styles.saveDraftBtn,
                      flex: 1
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                    <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>

                  {/* Botões de Categoria/Status do Admin (Ativar Venda / Pausar Venda) */}
                  {activeProduct.status === 'published' ? (
                    <button 
                      type="button" 
                      onClick={handlePauseSale} 
                      style={{
                        ...styles.rejectActionBtn,
                        backgroundColor: '#e65100',
                        color: '#ffffff',
                        flex: 1
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pause_circle</span>
                      <span>Pausar Venda</span>
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleApproveAndPublish} 
                      style={{
                        ...styles.approveSubmitBtn,
                        backgroundColor: '#2e7d32',
                        flex: 1
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                      <span>Ativar Venda</span>
                    </button>
                  )}
                </div>

                {/* Se a proposta estiver pendente (draft), exibe também o botão de Rejeitar/Solicitar Ajustes */}
                {activeProduct.status === 'draft' && (
                  <button 
                    type="button" 
                    onClick={handleRejectWithFeedback} 
                    style={{
                      ...styles.rejectActionBtn,
                      width: '100%'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                    <span>Rejeitar Proposta / Solicitar Ajustes</span>
                  </button>
                )}

                {/* Botão de Excluir Produto Definitivamente (Exclui tudo, incluindo imagens do Storage) */}
                {activeProduct.id && !activeProduct.id.startsWith('req-') && (
                  <button 
                    type="button" 
                    onClick={() => setDeleteConfirmModal({ isOpen: true, type: 'product' })}
                    disabled={saving}
                    style={{
                      ...styles.rejectActionBtn,
                      backgroundColor: 'rgba(186, 26, 26, 0.08)',
                      color: 'var(--error)',
                      width: '100%',
                      marginTop: '4px',
                      border: '1.5px solid var(--error)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_forever</span>
                    <span>Excluir Produto Definitivamente</span>
                  </button>
                )}
              </div>

            </form>
          ) : (
            <div style={styles.emptyEditorCard}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline)' }}>inventory_2</span>
              <h3 style={{ fontWeight: '800', fontSize: '16px', margin: '8px 0 4px 0' }}>Selecione um Produto</h3>
              <p style={{ fontSize: '13px', color: 'var(--outline)', margin: 0, textAlign: 'center', maxWidth: '300px' }}>
                Clique em qualquer produto da lista lateral para visualizar, alterar seus dados, gerenciar imagens e controlar a ativação de venda.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmModal?.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000
        }}>
          <div style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(186, 26, 26, 0.08)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                {deleteConfirmModal.type === 'product' ? 'delete_forever' : 'delete'}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '850', margin: 0, color: 'var(--on-surface)', fontFamily: 'Plus Jakarta Sans' }}>
              Confirmar Exclusão
            </h3>

            <div style={{ fontSize: '13.5px', color: 'var(--outline)', margin: 0, lineHeight: '20px' }}>
              {deleteConfirmModal.type === 'product' ? (
                <div>
                  Tem certeza que deseja excluir o produto <strong>{activeProduct?.title}</strong> definitivamente?
                  <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: '750', marginTop: '8px', display: 'block' }}>
                    ⚠️ Esta ação removerá o produto do catálogo e excluirá todos os seus arquivos do servidor do Supabase.
                  </span>
                </div>
              ) : (
                <div>
                  Tem certeza que deseja excluir esta imagem definitivamente? 
                  <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: '750', marginTop: '8px', display: 'block' }}>
                    ⚠️ O arquivo será apagado fisicamente do servidor de mídias.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'var(--surface-container-high)',
                  color: 'var(--on-surface-variant)',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmModal.type === 'product') {
                    handleDeleteProductConfirm();
                  } else if (deleteConfirmModal.type === 'image' && deleteConfirmModal.targetUrl) {
                    handleDeleteImageConfirm(deleteConfirmModal.targetUrl);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'var(--error)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(186, 26, 26, 0.15)'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos Premium UÁRI Admin
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '14px 24px',
    color: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 99999,
    fontSize: '13px',
    fontWeight: '750',
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
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: 'var(--outline)',
    fontWeight: '550',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '12px',
    color: 'var(--outline)',
    fontWeight: '750',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: '850',
    color: 'var(--on-surface)',
  },
  mainWorkspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftQueueColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightEditorColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--surface-container-highest)',
    boxShadow: '0px 4px 24px rgba(0,0,0,0.015)',
  },
  cardSectionTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    margin: 0,
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--outline)',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    borderRadius: '10px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--surface-container-low)',
  },
  filterSection: {
    marginBottom: '16px',
    borderBottom: '1px solid var(--outline-variant)',
    paddingBottom: '14px',
  },
  filterTabContainer: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'var(--surface-container-low)',
    padding: '4px',
    borderRadius: '8px',
  },
  filterTabButton: {
    flex: 1,
    padding: '6px 8px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '750px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  emptyQueueState: {
    padding: '48px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px dashed var(--outline-variant)',
    borderRadius: '12px',
  },
  queueItemCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  queueItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  queueStoreName: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--outline)',
    textTransform: 'uppercase',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: '120px'
  },
  statusIndicatorBadge: {
    fontSize: '9.5px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  queueProductTitle: {
    fontWeight: '750',
    color: 'var(--on-surface)',
    margin: '0 0 8px 0',
    lineHeight: '16px',
  },
  queueItemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueCategoryTag: {
    fontSize: '10px',
    fontWeight: '750',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  queuePriceText: {
    fontWeight: '800',
    color: 'var(--tertiary)',
  },
  editorHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  editorPreTitle: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '1px',
    marginBottom: '2px',
  },
  editorMainTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    fontFamily: 'Plus Jakarta Sans',
    margin: 0,
  },
  editorStoreTag: {
    backgroundColor: 'rgba(110,0,193,0.06)',
    color: 'var(--primary)',
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 12px',
    borderRadius: '9999px',
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--surface-container-highest)',
    paddingBottom: '20px',
  },
  editorSectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  fieldInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
  },
  rowFormFields: {
    display: 'flex',
    gap: '16px',
  },
  fieldSelect: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    width: '100%',
  },
  priceInputBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pricePrefix: {
    position: 'absolute',
    left: '12px',
    fontWeight: '750',
    color: 'var(--outline)',
    fontSize: '13px',
    pointerEvents: 'none',
  },
  priceInputField: {
    width: '100%',
    padding: '10px 14px 10px 34px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    fontWeight: '750',
  },
  fieldTextarea: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Plus Jakarta Sans',
    color: 'var(--on-surface)',
    backgroundColor: '#ffffff',
    resize: 'vertical',
    lineHeight: '18px',
  },
  fieldHelp: {
    fontSize: '10.5px',
    color: 'var(--outline)',
    fontWeight: '550',
  },
  imageSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  imageSectionDesc: {
    fontSize: '11px',
    color: 'var(--outline)',
    margin: '2px 0 0 0',
    fontWeight: '550',
  },
  imageAssetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
  },
  imageAssetCard: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  imageAssetLabel: {
    fontSize: '10px',
    textAlign: 'center',
    display: 'block',
    textTransform: 'capitalize',
  },
  assetCheckedCircle: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  saveDraftBtn: {
    backgroundColor: 'transparent',
    border: '1.5px solid var(--primary)',
    color: 'var(--primary)',
    borderRadius: '9999px',
    padding: '10px 24px',
    fontSize: '13.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans',
  },
  approveSubmitBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '10px 24px',
    fontSize: '13.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(46, 125, 80, 0.15)',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans',
  },
  rejectActionBtn: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    border: 'none',
    color: 'var(--error)',
    borderRadius: '9999px',
    padding: '10px 24px',
    fontSize: '13.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans',
  },
  emptyEditorCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    padding: '64px 32px',
    border: '1px solid var(--surface-container-highest)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    boxShadow: '0px 4px 24px rgba(0,0,0,0.01)',
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: '750',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  illustrationSvg: {
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  miniFileUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 14px',
    border: '1.5px dashed var(--primary)',
    borderRadius: '8px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    color: 'var(--primary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '12px',
    fontWeight: '800',
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
  }
};
