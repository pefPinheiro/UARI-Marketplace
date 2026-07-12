'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Plan {
  id: string;
  title: string;
  price: number;
}

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
  stock: number;
  is_featured: boolean;
  attributes: {
    sizes?: string[];
    colors?: Array<{ name: string; url?: string }>;
    custom_info?: Array<{ key: string; value: string; imageUrl?: string }>;
    tags?: string[];
    [key: string]: any;
  };
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  logo_url: string;
  banner_url: string;
  description: string;
  document_cnpj: string;
  is_verified: boolean;
  whatsapp_number: string;
  plan_id: string;
  subscription_status?: 'trial' | 'active' | 'inactive';
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phones?: Array<{ number: string; isWhatsapp: boolean }>;
    is_trusted?: boolean;
    logistics?: {
      delivery?: boolean;
      retirada?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

type Params = Promise<{ id: string }>;

export default function LojistaDetailPage(props: { params: Params }) {
  const resolvedParams = React.use(props.params);
  const id = resolvedParams.id;

  // Estados principais
  const [store, setStore] = useState<Store | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Controle do Modo de Edição
  const [isEditing, setIsEditing] = useState(false);

  // Estados dos Formulários da Loja
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'inactive'>('active');
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Selos e Logística
  const [isTrusted, setIsTrusted] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);

  // Lista de telefones de contato do lojista
  const [phonesList, setPhonesList] = useState<Array<{ number: string; isWhatsapp: boolean }>>([
    { number: '', isWhatsapp: true }
  ]);

  // Endereço
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Tefé');
  const [state, setState] = useState('AM');
  const [zipCode, setZipCode] = useState('69470-000');

  // Estados de Gerenciamento de Produtos (Modal)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [productOriginalPrice, setProductOriginalPrice] = useState('0');
  const [productCurrentPrice, setProductCurrentPrice] = useState('0');
  const [productStock, setProductStock] = useState('10');
  const [productStatus, setProductStatus] = useState<'draft' | 'published' | 'rejected'>('draft');
  const [productIsFeatured, setProductIsFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Tags do Produto
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Atributos de Produtos (iguais ao do Lojista)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [colorFile, setColorFile] = useState<File | null>(null);
  const [colorFileUrl, setColorFileUrl] = useState('');
  const [colorsList, setColorsList] = useState<Array<{ name: string; url?: string }>>([]);
  const [uploadingColor, setUploadingColor] = useState(false);

  const [infoKeyInput, setInfoKeyInput] = useState('');
  const [infoValInput, setInfoValInput] = useState('');
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [infoFileUrl, setInfoFileUrl] = useState('');
  const [infoList, setInfoList] = useState<Array<{ key: string; value: string; imageUrl?: string }>>([]);
  const [uploadingInfo, setUploadingInfo] = useState(false);

  // Mídias do Produto
  const [productImages, setProductImages] = useState<Array<{ id: string; url: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualImageUrlInput, setManualImageUrlInput] = useState('');

  // Helper para notificações
  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Upload genérico de imagens para o Supabase Storage no bucket "products"
  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

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
  };

  // Buscar todos os planos
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, title, price')
        .order('price', { ascending: true });

      if (error) throw error;
      if (data) setPlans(data);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  };

  // Carregar dados do Lojista
  const loadLojistaData = async () => {
    setLoading(true);
    try {
      // 1. Detalhes da loja e do proprietário
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          logo_url,
          banner_url,
          description,
          document_cnpj,
          is_verified,
          whatsapp_number,
          plan_id,
          subscription_status,
          address,
          profiles (
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (storeError) throw storeError;

      if (storeData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawStore = storeData as any;
        const mappedStore: Store = {
          id: rawStore.id,
          name: rawStore.name,
          logo_url: rawStore.logo_url || '',
          banner_url: rawStore.banner_url || '',
          description: rawStore.description || '',
          document_cnpj: rawStore.document_cnpj || '',
          is_verified: !!rawStore.is_verified,
          whatsapp_number: rawStore.whatsapp_number || '',
          plan_id: rawStore.plan_id || '',
          subscription_status: rawStore.subscription_status || 'trial',
          address: rawStore.address || {},
          profiles: rawStore.profiles ? {
            full_name: Array.isArray(rawStore.profiles) ? rawStore.profiles[0]?.full_name : rawStore.profiles.full_name,
            email: Array.isArray(rawStore.profiles) ? rawStore.profiles[0]?.email : rawStore.profiles.email,
          } : undefined
        };

        setStore(mappedStore);
        setStoreName(mappedStore.name);
        setDescription(mappedStore.description);
        setLogoUrl(mappedStore.logo_url);
        setBannerUrl(mappedStore.banner_url);
        setCnpj(mappedStore.document_cnpj);
        setIsVerified(mappedStore.is_verified);
        setSelectedPlanId(mappedStore.plan_id);
        setSubscriptionStatus(mappedStore.subscription_status || 'trial');

        // Carrega selos e logística
        const addr = mappedStore.address;
        setIsTrusted(!!addr.is_trusted);
        setHasDelivery(!!addr.logistics?.delivery);

        // Carrega telefones
        const savedPhones = addr.phones;
        if (Array.isArray(savedPhones) && savedPhones.length > 0) {
          setPhonesList(savedPhones);
        } else if (mappedStore.whatsapp_number) {
          setPhonesList([{ number: mappedStore.whatsapp_number, isWhatsapp: true }]);
        } else {
          setPhonesList([{ number: '', isWhatsapp: true }]);
        }

        setStreet(addr.street || '');
        setNumber(addr.number || '');
        setNeighborhood(addr.neighborhood || '');
        setCity(addr.city || 'Tefé');
        setState(addr.state || 'AM');
        setZipCode(addr.zip_code || '69470-000');
      }

      // 2. Buscar produtos associados
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      if (productsData) setProducts(productsData);

    } catch (err) {
      console.error('Erro ao carregar dados do lojista:', err);
      triggerNotification('Erro ao carregar dados do lojista no Supabase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    loadLojistaData();
  }, [id]);

  // Upload específico do Logo do lojista
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingLogo(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadFile(file);
      setLogoUrl(publicUrl);
      triggerNotification('Logotipo carregado com sucesso!');
    } catch (err) {
      console.error('Erro no upload da logo:', err);
      triggerNotification('Erro ao carregar logo para o storage.', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Upload específico do Banner do lojista
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingBanner(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadFile(file);
      setBannerUrl(publicUrl);
      triggerNotification('Banner carregado com sucesso!');
    } catch (err) {
      console.error('Erro no upload do banner:', err);
      triggerNotification('Erro ao carregar banner para o storage.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  // Gerenciador de Telefones
  const handleAddPhoneField = () => {
    setPhonesList([...phonesList, { number: '', isWhatsapp: false }]);
  };

  const handleRemovePhoneField = (index: number) => {
    if (phonesList.length <= 1) return;
    const updated = phonesList.filter((_, idx) => idx !== index);
    if (phonesList[index].isWhatsapp && updated.length > 0) {
      updated[0].isWhatsapp = true;
    }
    setPhonesList(updated);
  };

  const handlePhoneChange = (index: number, field: 'number' | 'isWhatsapp', value: any) => {
    const updated = phonesList.map((p, idx) => {
      if (idx === index) {
        if (field === 'isWhatsapp') {
          return { ...p, isWhatsapp: value };
        }
        return { ...p, number: value };
      }
      if (field === 'isWhatsapp' && value === true) {
        return { ...p, isWhatsapp: false };
      }
      return p;
    });
    setPhonesList(updated);
  };

  // Cancelar Edição e Restaurar Valores
  const handleCancelEdit = () => {
    if (store) {
      setStoreName(store.name);
      setDescription(store.description);
      setLogoUrl(store.logo_url);
      setBannerUrl(store.banner_url);
      setCnpj(store.document_cnpj);
      setIsVerified(store.is_verified);
      setSelectedPlanId(store.plan_id);

      const addr = store.address;
      setIsTrusted(!!addr.is_trusted);
      setHasDelivery(!!addr.logistics?.delivery);

      if (Array.isArray(addr.phones) && addr.phones.length > 0) {
        setPhonesList(addr.phones);
      } else if (store.whatsapp_number) {
        setPhonesList([{ number: store.whatsapp_number, isWhatsapp: true }]);
      } else {
        setPhonesList([{ number: '', isWhatsapp: true }]);
      }

      setStreet(addr.street || '');
      setNumber(addr.number || '');
      setNeighborhood(addr.neighborhood || '');
      setCity(addr.city || 'Tefé');
      setState(addr.state || 'AM');
      setZipCode(addr.zip_code || '69470-000');
    }
    setIsEditing(false);
  };

  // Salvar Informações da Loja
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);

    const mainWhatsapp = phonesList.find(p => p.isWhatsapp)?.number || '';
    const updatedAddress = {
      ...(store?.address || {}),
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code: zipCode,
      phones: phonesList.filter(p => p.number.trim() !== ''),
      is_trusted: isTrusted,
      logistics: {
        ...(store?.address?.logistics || {}),
        delivery: hasDelivery
      }
    };

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          description,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          document_cnpj: cnpj || null,
          is_verified: isVerified,
          whatsapp_number: mainWhatsapp || null,
          plan_id: selectedPlanId || null,
          address: updatedAddress
        })
        .eq('id', id);

      if (error) throw error;

      triggerNotification('✓ Informações salvas com sucesso!');
      setIsEditing(false);
      loadLojistaData();
    } catch (err) {
      console.error('Erro ao atualizar lojista:', err);
      triggerNotification('Erro ao salvar as configurações no banco.', 'error');
    } finally {
      setSavingStore(false);
    }
  };

  // Toggle rápido de Homologação (Selo Verificado)
  const handleToggleVerification = async () => {
    const nextVerifyState = !isVerified;
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_verified: nextVerifyState })
        .eq('id', id);

      if (error) throw error;

      setIsVerified(nextVerifyState);
      if (store) setStore({ ...store, is_verified: nextVerifyState });
      triggerNotification(
        nextVerifyState 
          ? '✓ Lojista homologado com sucesso!' 
          : '✓ Homologação do lojista revogada.'
      );
    } catch (err) {
      console.error('Erro ao homologar lojista:', err);
      triggerNotification('Erro ao atualizar homologação.', 'error');
    }
  };

  // Alternar Status de Ativo / Suspenso (Desativar)
  const handleToggleActiveStatus = async () => {
    const nextStatus = subscriptionStatus === 'inactive' ? 'active' : 'inactive';
    const nextVerifyState = nextStatus === 'active'; // Se reativar, marca como verificado
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          subscription_status: nextStatus,
          is_verified: nextVerifyState
        })
        .eq('id', id);

      if (error) throw error;

      setSubscriptionStatus(nextStatus);
      setIsVerified(nextVerifyState);
      if (store) {
        setStore({ 
          ...store, 
          subscription_status: nextStatus,
          is_verified: nextVerifyState
        });
      }
      triggerNotification(
        nextStatus === 'inactive'
          ? '⚠️ Lojista desativado/suspenso com sucesso.'
          : '✓ Lojista reativado com sucesso!',
        nextStatus === 'inactive' ? 'info' : 'success'
      );
    } catch (err) {
      console.error('Erro ao alternar status do lojista:', err);
      triggerNotification('Erro ao atualizar status do lojista.', 'error');
    }
  };

  // Excluir Lojista permanentemente
  const handleDeleteStore = async () => {
    const confirmed = confirm(`Deseja REALMENTE excluir permanentemente a loja "${storeName}" e todos os seus produtos? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          alert(`Não é possível excluir a loja "${storeName}" porque ela possui registros vinculados (como pedidos/leads de vendas). Recomendamos desativar a loja temporariamente.`);
          return;
        }
        throw error;
      }

      triggerNotification(`✓ Loja "${storeName}" excluída com sucesso! Redirecionando...`, 'success');
      setTimeout(() => {
        window.location.href = '/lojistas';
      }, 1500);
    } catch (err) {
      console.error('Erro ao excluir lojista:', err);
      triggerNotification('Erro ao excluir o lojista no banco Supabase.', 'error');
    }
  };

  // Helpers de Atributos de Produto
  const handleToggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleAddColor = async () => {
    if (!colorInput.trim()) return;
    setUploadingColor(true);
    try {
      let url = '';
      if (colorFile) {
        url = await uploadFile(colorFile);
      }
      setColorsList([...colorsList, { name: colorInput.trim(), url }]);
      setColorInput('');
      setColorFile(null);
      setColorFileUrl('');
    } catch (err) {
      console.error('Erro ao adicionar cor:', err);
      triggerNotification('Erro ao carregar foto da cor.', 'error');
    } finally {
      setUploadingColor(false);
    }
  };

  const handleRemoveColor = (name: string) => {
    setColorsList(colorsList.filter(c => c.name !== name));
  };

  const handleAddInfo = async () => {
    if (!infoKeyInput.trim() || !infoValInput.trim()) return;
    setUploadingInfo(true);
    try {
      let imageUrl = '';
      if (infoFile) {
        imageUrl = await uploadFile(infoFile);
      }
      setInfoList([...infoList, { key: infoKeyInput.trim(), value: infoValInput.trim(), imageUrl }]);
      setInfoKeyInput('');
      setInfoValInput('');
      setInfoFile(null);
      setInfoFileUrl('');
    } catch (err) {
      console.error('Erro ao adicionar info customizada:', err);
      triggerNotification('Erro ao carregar foto do atributo.', 'error');
    } finally {
      setUploadingInfo(false);
    }
  };

  const handleRemoveInfo = (index: number) => {
    setInfoList(infoList.filter((_, idx) => idx !== index));
  };

  // TAGs do Produto
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

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadFile(file);
      setProductImages([...productImages, { id: `img-${Date.now()}`, url: publicUrl }]);
      triggerNotification('Imagem adicionada ao catálogo!');
    } catch (err) {
      console.error('Erro no upload da imagem do produto:', err);
      triggerNotification('Erro ao enviar imagem ao storage.', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddManualImageUrl = () => {
    if (!manualImageUrlInput.trim()) return;
    setProductImages([...productImages, { id: `img-manual-${Date.now()}`, url: manualImageUrlInput.trim() }]);
    setManualImageUrlInput('');
    triggerNotification('URL de imagem adicionada!');
  };

  const handleRemoveProductImage = (imageId: string) => {
    setProductImages(productImages.filter(img => img.id !== imageId));
  };

  // Abrir Modal de Produto
  const openProductModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setProductTitle(product.title);
      setProductDescription(product.description || '');
      setProductCategory(product.category);
      setCustomCategory('');
      setProductOriginalPrice(product.original_price.toString());
      setProductCurrentPrice(product.current_price.toString());
      setProductStock(product.stock.toString());
      setProductStatus(product.status);
      setProductIsFeatured(!!product.is_featured);
      
      const imgs = Array.isArray(product.images) ? product.images : [];
      setProductImages(imgs.map((url, idx) => ({ id: `img-${idx}`, url })));

      const attrs = product.attributes || {};
      setSelectedSizes(attrs.sizes || []);
      setColorsList(attrs.colors || []);
      setInfoList(attrs.custom_info || []);
      setTagsList(attrs.tags || []);
      setTagInput('');
    } else {
      setEditingProduct(null);
      setProductTitle('');
      setProductDescription('');
      setProductCategory('Artesanato');
      setCustomCategory('');
      setProductOriginalPrice('0');
      setProductCurrentPrice('0');
      setProductStock('10');
      setProductStatus('draft');
      setProductIsFeatured(false);
      setProductImages([]);
      setSelectedSizes([]);
      setColorsList([]);
      setInfoList([]);
      setTagsList([]);
      setTagInput('');
    }
    setShowProductModal(true);
  };

  // Salvar Produto (Inserir ou Atualizar)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    const origPrice = parseFloat(productOriginalPrice) || 0;
    const currPrice = parseFloat(productCurrentPrice) || 0;
    const stockVal = parseInt(productStock) || 0;
    const imgs = productImages.map(img => img.url);
    const finalCategory = productCategory === 'custom' ? customCategory.trim() || 'Outros' : productCategory;

    const attributes = {
      sizes: selectedSizes,
      colors: colorsList,
      custom_info: infoList,
      tags: tagsList
    };

    try {
      if (editingProduct) {
        // Atualizar
        const { error } = await supabase
          .from('products')
          .update({
            title: productTitle,
            description: productDescription,
            category: finalCategory,
            original_price: origPrice,
            current_price: currPrice,
            stock: stockVal,
            status: productStatus,
            is_featured: productIsFeatured,
            images: imgs,
            attributes
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        triggerNotification('✓ Produto atualizado com sucesso!');
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('products')
          .insert({
            store_id: id,
            title: productTitle,
            description: productDescription,
            category: finalCategory,
            original_price: origPrice,
            current_price: currPrice,
            stock: stockVal,
            status: productStatus,
            is_featured: productIsFeatured,
            images: imgs,
            attributes
          });

        if (error) throw error;
        triggerNotification('✓ Novo produto adicionado com sucesso!');
      }

      setShowProductModal(false);
      loadLojistaData();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      triggerNotification('Erro ao salvar produto no banco.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // Alterar Status do Produto Rapidamente (Curadoria)
  const changeProductStatusQuick = async (productId: string, newStatus: 'draft' | 'published' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      triggerNotification(`Status do produto alterado para "${newStatus === 'published' ? 'Publicado' : newStatus === 'rejected' ? 'Rejeitado' : 'Rascunho'}"`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error('Erro ao atualizar status do produto:', err);
      triggerNotification('Erro ao alterar status do produto.', 'error');
    }
  };

  // Excluir Produto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      triggerNotification('✓ Produto excluído com sucesso!', 'info');
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      triggerNotification('Erro ao excluir produto do banco.', 'error');
    }
  };

  // Encontrar o plano atual do lojista
  const currentPlan = plans.find(p => p.id === (store?.plan_id || selectedPlanId));

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Carregando dados do lojista...</span>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={styles.errorContainer}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>store_slash</span>
        <h2>Lojista não encontrado</h2>
        <p>O lojista informado não foi encontrado ou foi removido do sistema.</p>
        <Link href="/lojistas" style={styles.backLinkBtn}>Voltar para Lojistas</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          ...styles.toast,
          backgroundColor: notification.type === 'success' ? 'var(--tertiary)' : notification.type === 'error' ? 'var(--error)' : 'var(--primary)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Back Button */}
      <section style={styles.backHeader}>
        <Link href="/lojistas" style={styles.backLink}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          <span>Voltar para Gestão de Lojistas</span>
        </Link>
      </section>

      {/* Visual Landpage Header (Banner & Logo) */}
      <section style={styles.storeHeroSection}>
        <div style={{
          ...styles.bannerContainer,
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary-container) 100%)'
        }}>
          {!bannerUrl && <div style={styles.gradientOverlay} />}
        </div>
        
        <div style={styles.profileHeaderOverlay}>
          <div style={styles.logoCircle}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} style={styles.logoImg} />
            ) : (
              <div style={styles.logoFallback}>
                <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--outline)' }}>storefront</span>
              </div>
            )}
          </div>

          <div style={styles.storeInfoText}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={styles.storeTitleName}>{storeName || 'Sem nome'}</h1>
              
              {/* Homologado Badge */}
              <span style={{
                ...styles.statusBadge,
                ...(subscriptionStatus === 'inactive' ? styles.statusSuspenso : (isVerified ? styles.statusAtivo : styles.statusPendente))
              }}>
                <span style={{
                  ...styles.statusDot,
                  backgroundColor: subscriptionStatus === 'inactive' ? '#ba1a1a' : (isVerified ? '#1a7312' : '#fe6b00')
                }} />
                {subscriptionStatus === 'inactive' ? 'Suspenso' : (isVerified ? 'Homologado' : 'Aguardando Verificação')}
              </span>

              {/* Loja Confiante Badge */}
              {isTrusted && (
                <span style={styles.trustBadgeSeal}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                  <span>Loja Confiante</span>
                </span>
              )}

              {/* Faz Entrega Badge */}
              {hasDelivery && (
                <span style={styles.deliveryBadgeSeal}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>local_shipping</span>
                  <span>Faz Entrega</span>
                </span>
              )}
            </div>
            <p style={styles.storeSlogan}>{description || 'Sem descrição cadastrada.'}</p>
            <span style={styles.ownerSubText}>Proprietário: {store.profiles?.full_name || 'Usuário Local'} • {store.profiles?.email}</span>
          </div>

          <div style={styles.headerActionContainer}>
            <button 
              type="button" 
              onClick={handleToggleVerification} 
              style={{
                ...styles.homologBtn,
                backgroundColor: isVerified ? 'var(--surface-container-high)' : 'var(--tertiary)',
                color: isVerified ? 'var(--on-surface)' : '#ffffff'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {isVerified ? 'gpp_bad' : 'verified'}
              </span>
              <span>{isVerified ? 'Deshomologar' : 'Homologar Loja'}</span>
            </button>

            <button 
              type="button" 
              onClick={handleToggleActiveStatus} 
              style={{
                ...styles.homologBtn,
                backgroundColor: subscriptionStatus === 'inactive' ? 'rgba(26, 115, 18, 0.08)' : 'rgba(186, 26, 26, 0.08)',
                color: subscriptionStatus === 'inactive' ? '#1a7312' : '#ba1a1a',
                border: subscriptionStatus === 'inactive' ? '1px solid #1a7312' : '1px solid #ba1a1a'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {subscriptionStatus === 'inactive' ? 'check_circle' : 'block'}
              </span>
              <span>{subscriptionStatus === 'inactive' ? 'Reativar Loja' : 'Desativar Loja'}</span>
            </button>

            <button 
              type="button" 
              onClick={handleDeleteStore} 
              style={{
                ...styles.homologBtn,
                backgroundColor: 'var(--error-container)',
                color: 'var(--on-error-container)',
                border: '1px solid var(--error)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                delete
              </span>
              <span>Excluir Loja</span>
            </button>

            <button 
              type="button" 
              onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)} 
              style={{
                ...styles.editModeToggleBtn,
                backgroundColor: isEditing ? 'var(--error-container)' : 'var(--primary)',
                color: isEditing ? 'var(--on-error-container)' : '#ffffff'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {isEditing ? 'close' : 'edit'}
              </span>
              <span>{isEditing ? 'Cancelar Edição' : 'Editar Dados'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Info Cards / Form Section */}
      <section style={styles.contentMainCard}>
        {!isEditing ? (
          /* VIEW LANDING MODE */
          <div style={styles.viewLayoutGrid}>
            
            {/* Card 1: Plano & Parceria */}
            <div style={styles.infoMiniCard}>
              <div style={styles.miniCardHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>workspace_premium</span>
                <h3 style={styles.miniCardTitle}>Plano & Assinatura</h3>
              </div>
              <div style={styles.miniCardBody}>
                <span style={styles.planTitleDisplay}>{currentPlan?.title || 'Sem plano associado'}</span>
                <span style={styles.planPriceDisplay}>
                  {currentPlan ? `R$ ${currentPlan.price.toFixed(2)}/mês` : 'R$ 0,00'}
                </span>
                <p style={styles.planFeaturesText}>
                  Acesso completo à plataforma de vendas, suporte operacional e curadoria dedicada de Tefé.
                </p>
                {/* Visual tags inside View Mode details */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {isTrusted && (
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(110, 0, 193, 0.08)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                      #UÁRIDeConfiança
                    </span>
                  )}
                  {hasDelivery && (
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(26, 115, 18, 0.08)', color: 'var(--tertiary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                      #FazEntrega
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Telefones de Contato & CNPJ */}
            <div style={styles.infoMiniCard}>
              <div style={styles.miniCardHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', fontSize: '20px' }}>assignment_ind</span>
                <h3 style={styles.miniCardTitle}>Contato & CNPJ</h3>
              </div>
              <div style={styles.miniCardBody}>
                <div style={styles.textLabelValueGroup}>
                  <span style={styles.textLabel}>CNPJ Cadastrado</span>
                  <span style={styles.textValue}>{cnpj || 'Não Informado'}</span>
                </div>
                <div style={{ ...styles.textLabelValueGroup, marginTop: '4px' }}>
                  <span style={styles.textLabel}>Telefones</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {phonesList.map((p, idx) => (
                      <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '750', color: 'var(--on-surface)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: p.isWhatsapp ? '#1a7312' : 'var(--outline)' }}>
                          {p.isWhatsapp ? 'chat' : 'call'}
                        </span>
                        <span>{p.number || 'Sem número'}</span>
                        {p.isWhatsapp && <span style={{ fontSize: '9px', backgroundColor: 'rgba(26, 115, 18, 0.08)', color: '#1a7312', padding: '1px 6px', borderRadius: '4px' }}>whatsapp</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Endereço Comercial */}
            <div style={styles.infoMiniCard}>
              <div style={styles.miniCardHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary-container)', fontSize: '20px' }}>location_on</span>
                <h3 style={styles.miniCardTitle}>Endereço Comercial</h3>
              </div>
              <div style={styles.miniCardBody}>
                {street ? (
                  <div style={styles.addressDisplayBlock}>
                    <span style={styles.addressLineMain}>{street}, nº {number || 'S/N'}</span>
                    <span style={styles.addressLineSub}>{neighborhood} • CEP {zipCode}</span>
                    <span style={styles.addressLineSub}>{city} - {state}</span>
                  </div>
                ) : (
                  <p style={{ color: 'var(--outline)', fontSize: '13px' }}>Nenhum endereço comercial cadastrado.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* EDIT MODE FORM */
          <form onSubmit={handleSaveStore} style={styles.editForm}>
            <div style={styles.editFormHeader}>
              <h2 style={styles.editFormTitle}>Atualizar Dados Cadastrais</h2>
              <p style={styles.editFormSub}>Modifique as informações operacionais e visuais deste lojista.</p>
            </div>

            {/* Upload Boxes de Logo e Banner */}
            <div style={styles.visualSetupGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Logotipo da Loja</label>
                <div style={styles.logoUploadAreaContainer}>
                  <label htmlFor="logo-file-upload" style={styles.logoUploadBox}>
                    {logoUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo" style={styles.uploadedLogoImage} />
                        <div style={styles.imageOverlayText}>Alterar Logo</div>
                      </div>
                    ) : (
                      <div style={styles.uploadBoxPlaceholder}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>add_photo_alternate</span>
                        <span style={{ fontSize: '11px', fontWeight: '750', color: 'var(--on-surface-variant)' }}>
                          {uploadingLogo ? 'Enviando...' : 'Carregar Logo'}
                        </span>
                      </div>
                    )}
                  </label>
                  <input 
                    id="logo-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                  {/* URL Manual Fallback */}
                  <input 
                    type="text"
                    placeholder="Ou cole a URL da logo..."
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    style={{ ...styles.input, fontSize: '11px', padding: '6px 10px', marginTop: '6px' }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Banner da Loja</label>
                <div style={styles.bannerUploadAreaContainer}>
                  <label htmlFor="banner-file-upload" style={styles.bannerUploadBox}>
                    {bannerUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bannerUrl} alt="Banner" style={styles.uploadedBannerImage} />
                        <div style={styles.imageOverlayText}>Alterar Banner</div>
                      </div>
                    ) : (
                      <div style={styles.uploadBoxPlaceholder}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>image</span>
                        <span style={{ fontSize: '11px', fontWeight: '750', color: 'var(--on-surface-variant)' }}>
                          {uploadingBanner ? 'Enviando...' : 'Carregar Banner'}
                        </span>
                      </div>
                    )}
                  </label>
                  <input 
                    id="banner-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                    style={{ display: 'none' }}
                  />
                  {/* URL Manual Fallback */}
                  <input 
                    type="text"
                    placeholder="Ou cole a URL do banner..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    style={{ ...styles.input, fontSize: '11px', padding: '6px 10px', marginTop: '6px' }}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <label style={styles.label}>Nome da Loja</label>
                <input 
                  type="text" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Plano Comercial</label>
                <select 
                  value={selectedPlanId} 
                  onChange={(e) => setSelectedPlanId(e.target.value)} 
                  style={styles.select}
                >
                  <option value="">Nenhum plano associado</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (R$ {p.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes: Selos de Confiança e Logística (Admin Request) */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Certificações, Selos & Logística</label>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isTrusted} 
                      onChange={(e) => setIsTrusted(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: '750', color: 'var(--on-surface-variant)' }}>Selo Loja Confiante (UÁRI de Confiança)</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={hasDelivery} 
                      onChange={(e) => setHasDelivery(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: '750', color: 'var(--on-surface-variant)' }}>Realiza Entregas (Logística/Delivery)</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Descrição/Slogan</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={2} 
                style={styles.textarea}
              />
            </div>

            {/* CNPJ e Gestão Telefônica */}
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>CNPJ</label>
                <input 
                  type="text" 
                  value={cnpj} 
                  onChange={(e) => setCnpj(e.target.value)} 
                  placeholder="00.000.000/0001-00"
                  style={styles.input}
                />
              </div>

              {/* Seção Dinâmica de Telefones */}
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={styles.label}>Telefones de Contato</label>
                  <button 
                    type="button" 
                    onClick={handleAddPhoneField} 
                    style={styles.inlineAddPhoneBtn}
                  >
                    + Telefone
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {phonesList.map((phone, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Ex: +55 (97) 99122-3344"
                        value={phone.number} 
                        onChange={(e) => handlePhoneChange(index, 'number', e.target.value)} 
                        style={{ ...styles.input, flex: 2 }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', flex: 1 }}>
                        <input 
                          type="checkbox" 
                          checked={phone.isWhatsapp} 
                          onChange={(e) => handlePhoneChange(index, 'isWhatsapp', e.target.checked)} 
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontWeight: '700', fontSize: '11px', color: 'var(--on-surface-variant)' }}>É WhatsApp</span>
                      </label>
                      {phonesList.length > 1 && (
                        <span 
                          className="material-symbols-outlined" 
                          style={{ color: 'var(--error)', cursor: 'pointer', fontSize: '20px' }}
                          onClick={() => handleRemovePhoneField(index)}
                        >
                          delete
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <label style={styles.label}>Logradouro</label>
                <input 
                  type="text" 
                  value={street} 
                  onChange={(e) => setStreet(e.target.value)} 
                  placeholder="Rua, Avenida..."
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Número</label>
                <input 
                  type="text" 
                  value={number} 
                  onChange={(e) => setNumber(e.target.value)} 
                  placeholder="123"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bairro</label>
                <input 
                  type="text" 
                  value={neighborhood} 
                  onChange={(e) => setNeighborhood(e.target.value)} 
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CEP</label>
                <input 
                  type="text" 
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)} 
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cidade</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Estado (UF)</label>
                <input 
                  type="text" 
                  value={state} 
                  onChange={(e) => setState(e.target.value)} 
                  maxLength={2}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.editActionsBlock}>
              <button type="button" onClick={handleCancelEdit} style={styles.discardBtn}>
                Descartar Alterações
              </button>
              <button type="submit" style={styles.saveBtn} disabled={savingStore}>
                {savingStore ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Catalog & Curation */}
      <section style={styles.contentMainCard}>
        <div style={styles.productsHeaderRow}>
          <div>
            <h2 style={styles.sectionTitleProducts}>Catálogo de Produtos</h2>
            <p style={styles.cardSubtitle}>Cure os itens expostos e adicione novos produtos ao estoque da loja.</p>
          </div>
          <button type="button" onClick={() => openProductModal(null)} style={styles.addProductBtn}>
            <span className="material-symbols-outlined">add</span>
            <span>Adicionar Produto</span>
          </button>
        </div>

        {/* Products Grid */}
        <div style={styles.productsGrid}>
          {products.length === 0 ? (
            <div style={styles.emptyProductsBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '38px', color: 'var(--outline)' }}>inventory_2</span>
              <span style={{ fontWeight: '750', fontSize: '14px', color: 'var(--on-surface)' }}>Nenhum produto cadastrado</span>
              <span style={{ fontSize: '12px', color: 'var(--outline)', textAlign: 'center' }}>Este lojista ainda não possui produtos no catálogo.</span>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} style={styles.premiumProductCard}>
                
                <div style={styles.prodHeader}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} style={styles.prodImg} />
                  ) : (
                    <div style={styles.prodImgFallback}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>image</span>
                    </div>
                  )}

                  <span style={{
                    ...styles.productStatusBadge,
                    ...(p.status === 'published' ? styles.statusPub : p.status === 'rejected' ? styles.statusRej : styles.statusDft)
                  }}>
                    {p.status === 'published' ? 'Publicado' : p.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
                  </span>
                </div>

                <div style={styles.prodDetails}>
                  <h4 style={styles.prodTitle}>{p.title}</h4>
                  <span style={styles.prodCat}>{p.category}</span>
                  
                  <div style={styles.prodMetaRow}>
                    <div style={styles.priceCol}>
                      <span style={styles.prodPriceBrl}>R$ {p.current_price.toFixed(2)}</span>
                      {p.original_price > p.current_price && (
                        <span style={styles.prodPriceOrigBrl}>R$ {p.original_price.toFixed(2)}</span>
                      )}
                    </div>
                    <span style={styles.prodStockBadge}>Qtd: {p.stock}</span>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div style={styles.prodActionsRow}>
                  {p.status !== 'published' && (
                    <button 
                      type="button" 
                      onClick={() => changeProductStatusQuick(p.id, 'published')} 
                      style={styles.cardQuickApprove}
                      title="Aprovar e Publicar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>done</span>
                      <span>Aprovar</span>
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button 
                      type="button" 
                      onClick={() => changeProductStatusQuick(p.id, 'rejected')} 
                      style={styles.cardQuickReject}
                      title="Rejeitar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      <span>Rejeitar</span>
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                    <button 
                      type="button" 
                      onClick={() => openProductModal(p)} 
                      style={styles.circleEditBtn}
                      title="Editar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteProduct(p.id)} 
                      style={styles.circleDeleteBtn}
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </section>

      {/* MODAL: Adicionar ou Editar Produto */}
      {showProductModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.productModalCard}>
            
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '850', color: 'var(--on-surface)', margin: 0 }}>
                  {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
                </h2>
                <p style={styles.cardSubtitle}>Defina ficha técnica, preços, tags e mídias do item no catálogo.</p>
              </div>
              <span className="material-symbols-outlined" style={styles.closeModalIcon} onClick={() => setShowProductModal(false)}>close</span>
            </div>

            <form onSubmit={handleSaveProduct} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome do Produto/Serviço</label>
                <input 
                  type="text" 
                  value={productTitle} 
                  onChange={(e) => setProductTitle(e.target.value)} 
                  placeholder="Ex: Cesta de Palha Tradicional G"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Categoria</label>
                  <select 
                    value={productCategory} 
                    onChange={(e) => setProductCategory(e.target.value)} 
                    style={styles.select}
                  >
                    <option value="Artesanato">Artesanato</option>
                    <option value="Frutas & Polpas">Frutas & Polpas</option>
                    <option value="Óleos & Essências">Óleos & Essências</option>
                    <option value="Peixes & Carnes">Peixes & Carnes</option>
                    <option value="Outros">Outros</option>
                    <option value="custom">+ Outro (Criar Categoria)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Status do Catálogo</label>
                  <select 
                    value={productStatus} 
                    onChange={(e) => setProductStatus(e.target.value as any)} 
                    style={styles.select}
                  >
                    <option value="draft">Rascunho (draft)</option>
                    <option value="published">Publicado (published)</option>
                    <option value="rejected">Rejeitado (rejected)</option>
                  </select>
                </div>
              </div>

              {/* Criação de Categoria Personalizada */}
              {productCategory === 'custom' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nome da Nova Categoria</label>
                  <input 
                    type="text" 
                    placeholder="Digite o nome da categoria personalizada..." 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={productCurrentPrice} 
                    onChange={(e) => setProductCurrentPrice(e.target.value)} 
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Preço Comparativo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={productOriginalPrice} 
                    onChange={(e) => setProductOriginalPrice(e.target.value)} 
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantidade Estoque</label>
                  <input 
                    type="number" 
                    value={productStock} 
                    onChange={(e) => setProductStock(e.target.value)} 
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição Detalhada</label>
                <textarea 
                  value={productDescription} 
                  onChange={(e) => setProductDescription(e.target.value)} 
                  placeholder="Descreva detalhes como materiais, peso, tamanho..."
                  rows={2}
                  style={styles.textarea}
                />
              </div>

              {/* Destaque Principal da Vitrine */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input 
                  type="checkbox"
                  id="product-is-featured-checkbox"
                  checked={productIsFeatured}
                  onChange={(e) => setProductIsFeatured(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="product-is-featured-checkbox" style={{ fontSize: '12px', fontWeight: '850', cursor: 'pointer', color: 'var(--on-surface-variant)', marginBottom: 0 }}>
                  Destacar este produto no topo da Vitrine (Destaque Principal)
                </label>
              </div>

              {/* TAGS do Produto para Pesquisa e Filtros */}
              <div style={{ ...styles.formGroup, marginTop: '4px' }}>
                <label style={styles.label}>TAGs do Produto (para pesquisas e filtros na vitrine)</label>
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
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={styles.attributeIncorporateBtn}
                  >
                    + Tag
                  </button>
                </div>
                {tagsList.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {tagsList.map((tag) => (
                      <span key={tag} style={styles.attributeBadge}>
                        <span>#{tag}</span>
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

              {/* FICHA TÉCNICA E ATRIBUTOS */}
              <div style={{ borderTop: '1px solid var(--surface-container-high)', marginTop: '8px', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '850', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Ficha Técnica & Atributos
                </h3>

                {/* Tamanhos */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tamanhos Disponíveis</label>
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
                            border: active ? '2.5px solid var(--primary-container)' : '1px solid var(--outline-variant)',
                            backgroundColor: active ? 'rgba(110, 0, 193, 0.04)' : 'transparent',
                            color: active ? 'var(--primary-container)' : 'var(--on-surface-variant)',
                            fontWeight: active ? '800' : '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cores */}
                <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                  <label style={styles.label}>Cores Disponíveis (Com foto opcional)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ex: Preto, Azul..."
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      style={{ ...styles.input, flex: 2 }}
                    />
                    
                    {/* Upload de Foto da Cor */}
                    <label htmlFor="color-image-upload" style={styles.miniFileUploadLabel}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>palette</span>
                      <span style={{ fontSize: '11px', fontWeight: '700' }}>
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
                      disabled={uploadingColor}
                      style={styles.attributeIncorporateBtn}
                    >
                      {uploadingColor ? '...' : '+ Cor'}
                    </button>
                  </div>

                  {colorFileUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={colorFileUrl} alt="Color preview" style={styles.miniThumbnail} />
                      <button type="button" onClick={() => { setColorFile(null); setColorFileUrl(''); }} style={styles.deleteMiniBtn}>Remover Foto</button>
                    </div>
                  )}

                  {colorsList.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {colorsList.map((c) => (
                        <span key={c.name} style={styles.attributeBadge}>
                          {c.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.url} alt={c.name} style={styles.superMiniThumbnail} />
                          )}
                          <span>{c.name}</span>
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
                <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                  <label style={styles.label}>Informações Customizadas</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Título (Ex: Peso)"
                      value={infoKeyInput}
                      onChange={(e) => setInfoKeyInput(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Valor (Ex: 2kg)"
                      value={infoValInput}
                      onChange={(e) => setInfoValInput(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />

                    {/* Foto da informação customizada (Opcional) */}
                    <label htmlFor="info-image-upload" style={styles.miniCameraUploadLabel} title="Adicionar imagem (opcional)">
                      {infoFileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={infoFileUrl} 
                          alt="Info" 
                          style={{ width: '100%', height: '100%', borderRadius: '7px', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>add_a_photo</span>
                      )}
                    </label>
                    <input 
                      id="info-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setInfoFile(file);
                        setInfoFileUrl(file ? URL.createObjectURL(file) : '');
                      }}
                      style={{ display: 'none' }}
                    />

                    <button
                      type="button"
                      onClick={handleAddInfo}
                      disabled={uploadingInfo}
                      style={styles.attributeIncorporateBtn}
                    >
                      {uploadingInfo ? '...' : '+ Info'}
                    </button>
                  </div>

                  {infoList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      {infoList.map((info, idx) => (
                        <div key={idx} style={styles.customInfoRow}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {info.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={info.imageUrl} alt={info.key} style={styles.superMiniThumbnail} />
                            )}
                            <span><strong>{info.key}:</strong> {info.value}</span>
                          </span>
                          <span
                            onClick={() => handleRemoveInfo(idx)}
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

              {/* Imagens do Produto */}
              <div style={{ ...styles.formGroup, marginTop: '16px', borderTop: '1px solid var(--surface-container-high)', paddingTop: '16px' }}>
                <label style={styles.label}>Imagens do Produto</label>
                
                <label htmlFor="product-image-upload" style={styles.fileUploadLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>cloud_upload</span>
                  <span style={{ fontWeight: '700', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                    {uploadingImage ? 'Enviando imagem ao storage...' : 'Clique para selecionar novas fotos'}
                  </span>
                </label>
                <input 
                  id="product-image-upload"
                  type="file" 
                  accept="image/*"
                  onChange={handleProductImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />

                {/* URL Manual Fallback */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Ou cole uma URL de imagem externa aqui..."
                    value={manualImageUrlInput}
                    onChange={(e) => setManualImageUrlInput(e.target.value)}
                    style={{ ...styles.input, flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddManualImageUrl} 
                    style={{ ...styles.attributeIncorporateBtn, minHeight: '34px', fontSize: '11px' }}
                  >
                    + URL
                  </button>
                </div>

                {/* Preview das imagens carregadas */}
                {productImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginTop: '14px' }}>
                    {productImages.map((img) => (
                      <div key={img.id} style={styles.multiImagePreviewCard}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Preview" style={styles.multiImageThumbnail} />
                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(img.id)}
                          style={styles.removeImageBtn}
                        >
                          ✕ Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões do Modal */}
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowProductModal(false)} style={styles.discardBtn}>
                  Cancelar
                </button>
                <button type="submit" style={styles.orangeBtn} disabled={savingProduct}>
                  {savingProduct ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Estilos Premium UÁRI Admin
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: 'var(--font-family)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid var(--surface-container-high)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '16px',
    textAlign: 'center',
  },
  backLinkBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: '800',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '13px',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
  },
  backHeader: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--outline)',
    fontWeight: '800',
    fontSize: '12px',
    transition: 'color 0.2s',
  },
  storeHeroSection: {
    position: 'relative',
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    border: '1px solid var(--surface-container-highest)',
    overflow: 'hidden',
    boxShadow: '0px 2px 12px rgba(0,0,0,0.02)',
  },
  bannerContainer: {
    height: '200px',
    width: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.1)',
  },
  profileHeaderOverlay: {
    display: 'flex',
    padding: '24px',
    gap: '24px',
    alignItems: 'flex-end',
    marginTop: '-50px',
    position: 'relative',
    flexWrap: 'wrap',
  },
  logoCircle: {
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '4px solid var(--surface-container-lowest)',
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--surface-container-high)',
  },
  storeInfoText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '280px',
  },
  storeTitleName: {
    fontSize: '24px',
    fontWeight: '850',
    color: 'var(--on-surface)',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  storeSlogan: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    margin: 0,
  },
  ownerSubText: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '700',
  },
  headerActionContainer: {
    display: 'flex',
    gap: '10px',
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  homologBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  editModeToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '850',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  contentMainCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '16px',
    border: '1px solid var(--surface-container-highest)',
    padding: '24px',
    boxShadow: '0px 2px 12px rgba(0,0,0,0.02)',
  },
  viewLayoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  infoMiniCard: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--surface-container-high)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  miniCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--surface-container-high)',
    paddingBottom: '8px',
  },
  miniCardTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
  },
  miniCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
  },
  planTitleDisplay: {
    fontSize: '16px',
    fontWeight: '850',
    color: 'var(--primary)',
  },
  planPriceDisplay: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
  },
  planFeaturesText: {
    fontSize: '11px',
    color: 'var(--outline)',
    lineHeight: '1.4',
    margin: 0,
  },
  textLabelValueGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  textLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--outline)',
    textTransform: 'uppercase',
  },
  textValue: {
    fontSize: '13px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  addressDisplayBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  addressLineMain: {
    fontSize: '13px',
    fontWeight: '750',
    color: 'var(--on-surface)',
  },
  addressLineSub: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '600',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  editFormHeader: {
    borderBottom: '1px solid var(--surface-container-high)',
    paddingBottom: '10px',
  },
  editFormTitle: {
    fontSize: '16px',
    fontWeight: '850',
    color: 'var(--on-surface)',
    margin: 0,
  },
  editFormSub: {
    fontSize: '12px',
    color: 'var(--outline)',
    margin: '2px 0 0 0',
  },
  visualSetupGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '180px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '850',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--surface)',
    outline: 'none',
    transition: 'all 0.2s',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--surface)',
    outline: 'none',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--outline-variant)',
    fontSize: '13px',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--surface)',
    outline: 'none',
    fontFamily: 'inherit',
  },
  inlineAddPhoneBtn: {
    border: 'none',
    backgroundColor: 'rgba(110, 0, 193, 0.08)',
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  editActionsBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    borderTop: '1px solid var(--surface-container-high)',
    paddingTop: '16px',
  },
  discardBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface-variant)',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--tertiary-container)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '850',
    fontSize: '12px',
    cursor: 'pointer',
  },
  productsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--surface-container-high)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  sectionTitleProducts: {
    fontSize: '18px',
    fontWeight: '850',
    color: 'var(--on-surface)',
    margin: 0,
  },
  addProductBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '850',
    fontSize: '12px',
    cursor: 'pointer',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  emptyProductsBox: {
    gridColumn: '1 / -1',
    padding: '48px 16px',
    border: '2px dashed var(--surface-container-high)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  premiumProductCard: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--surface-container-high)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.01)',
  },
  prodHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  prodImg: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid var(--surface-container-highest)',
  },
  prodImgFallback: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: 'var(--surface-container-high)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--outline)',
  },
  prodDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  prodTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    margin: 0,
  },
  prodCat: {
    fontSize: '11px',
    color: 'var(--outline)',
    fontWeight: '700',
  },
  prodMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
  },
  priceCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  prodPriceBrl: {
    fontSize: '14px',
    fontWeight: '850',
    color: 'var(--tertiary-container)',
  },
  prodPriceOrigBrl: {
    fontSize: '11px',
    color: 'var(--outline)',
    textDecoration: 'line-through',
  },
  prodStockBadge: {
    fontSize: '10px',
    backgroundColor: 'var(--surface-container-high)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
  },
  prodActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderTop: '1px solid var(--surface-container-high)',
    paddingTop: '12px',
    marginTop: 'auto',
  },
  cardQuickApprove: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    color: '#1a7312',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  cardQuickReject: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    color: '#ba1a1a',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  circleEditBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  circleDeleteBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    color: '#ba1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  productStatusBadge: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  statusPub: {
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    color: '#1a7312',
  },
  statusRej: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: '#ba1a1a',
  },
  statusDft: {
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--outline)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '850',
  },
  statusAtivo: {
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    color: '#1a7312',
  },
  statusPendente: {
    backgroundColor: 'rgba(254, 107, 0, 0.08)',
    color: '#fe6b00',
  },
  statusSuspenso: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: '#ba1a1a',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  trustBadgeSeal: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '850',
    backgroundColor: 'rgba(110, 0, 193, 0.08)',
    color: 'var(--primary)',
  },
  deliveryBadgeSeal: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '850',
    backgroundColor: 'rgba(26, 115, 18, 0.08)',
    color: '#1a7312',
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
    padding: '16px',
  },
  productModalCard: {
    backgroundColor: 'var(--surface-container-lowest)',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--surface-container-high)',
    paddingBottom: '12px',
  },
  closeModalIcon: {
    cursor: 'pointer',
    color: 'var(--outline)',
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
    marginTop: '12px',
    borderTop: '1px solid var(--surface-container-high)',
    paddingTop: '16px',
  },
  orangeBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: '850',
    fontSize: '13px',
    cursor: 'pointer',
  },
  fileUploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '24px',
    border: '2px dashed var(--primary)',
    borderRadius: '12px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
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
    fontWeight: '700',
    minHeight: '38px',
    flexShrink: 0,
  },
  miniCameraUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px dashed var(--outline-variant)',
    cursor: 'pointer',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    flexShrink: 0,
  },
  attributeIncorporateBtn: {
    padding: '10px 16px',
    backgroundColor: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
    color: 'var(--on-surface)',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    minHeight: '38px',
  },
  attributeBadge: {
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
  },
  customInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--surface-container-high)',
    borderRadius: '8px',
    fontSize: '13px',
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
  },
  multiImagePreviewCard: {
    position: 'relative',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--surface-container-high)',
    borderRadius: '8px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  multiImageThumbnail: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid var(--outline-variant)',
  },
  removeImageBtn: {
    width: '100%',
    padding: '4px 0',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    color: 'var(--error)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
  },
  // Upload Estilizado para Logo e Banner
  logoUploadAreaContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  logoUploadBox: {
    height: '120px',
    width: '100%',
    border: '2px dashed var(--primary)',
    borderRadius: '12px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
  },
  uploadedLogoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '10px',
  },
  bannerUploadAreaContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  bannerUploadBox: {
    height: '120px',
    width: '100%',
    border: '2px dashed var(--primary)',
    borderRadius: '12px',
    backgroundColor: 'rgba(110, 0, 193, 0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
  },
  uploadedBannerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px',
  },
  imageOverlayText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '800',
    textAlign: 'center',
    padding: '4px 0',
    textTransform: 'uppercase',
  },
  uploadBoxPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};
