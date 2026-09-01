'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createProduct } from '@/actions/product';
import {
  Package,
  Barcode,
  DollarSign,
  TrendingUp,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
  Box,
  Camera,
  RotateCcw,
  Smartphone,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  Building2,
  Scale,
} from 'lucide-react';

interface ProductFormProps {
  existingCategories?: string[];
}

const QUICK_TAGS = [
  '❄️ Rayon Frais',
  '🏷️ Consigné',
  '🌟 Produit Local',
  '🔥 Promotion',
  '📦 Format Familial',
  '⚡ Vente Rapide',
  '🥛 Laitier',
  '🥤 Boisson',
];

export default function ProductForm({ existingCategories = [] }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for Live Interactive Preview
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitsPerCarton, setUnitsPerCarton] = useState<number>(1);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [priceHT, setPriceHT] = useState<number | ''>('');
  const [priceTTC, setPriceTTC] = useState<number | ''>('');
  
  // Section 5 Structured Details
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [brand, setBrand] = useState('');
  const [volumeSize, setVolumeSize] = useState('');
  const [aisleLocation, setAisleLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Camera Capture Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generate random barcode / SKU
  const generateSku = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'ART';
    setSku(`${prefix}-${randomCode}`);
  };

  // Toggle quick tags
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  // Live Margin Computations
  const numPurchase = typeof purchasePrice === 'number' ? purchasePrice : 0;
  const numTTC = typeof priceTTC === 'number' ? priceTTC : 0;
  const marginAmount = numTTC - numPurchase;
  const marginRate = numPurchase > 0 ? (marginAmount / numPurchase) * 100 : 0;

  // Handle HT change to auto-calculate TTC
  const handlePriceHTChange = (val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setPriceHT('');
      setPriceTTC('');
    } else {
      setPriceHT(parsed);
      setPriceTTC(Math.round(parsed * 1.18));
    }
  };

  // Handle TTC change to auto-calculate HT
  const handlePriceTTCChange = (val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setPriceTTC('');
      setPriceHT('');
    } else {
      setPriceTTC(parsed);
      setPriceHT(Math.round(parsed / 1.18));
    }
  };

  // Handle Images selection from gallery/disk
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // Camera In-Browser Stream Handler
  // ==========================================
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setIsCameraOpen(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Impossible d’accéder à la caméra. Vérifiez les autorisations de votre navigateur ou utilisez l’appareil photo natif.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `photo_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            setImageFiles((prev) => [...prev, file]);
            setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
            stopCamera();
          }
        },
        'image/jpeg',
        0.88
      );
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (!sku) {
        generateSku();
      }

      // Build structured short description if not manually typed
      let finalShortDesc = shortDescription;
      if (!finalShortDesc) {
        const parts: string[] = [];
        if (brand) parts.push(`Marque: ${brand}`);
        if (volumeSize) parts.push(volumeSize);
        if (aisleLocation) parts.push(`Rayon: ${aisleLocation}`);
        if (selectedTags.length > 0) parts.push(selectedTags.join(' '));
        finalShortDesc = parts.join(' • ');
      }
      formData.set('shortDescription', finalShortDesc);

      // Build detailed long description
      let finalLongDesc = longDescription;
      if (brand || aisleLocation || selectedTags.length > 0) {
        const metaSummary = `[Détails Supermarché]\nMarque: ${brand || 'N/A'}\nFormat: ${volumeSize || 'Standard'}\nEmplacement: ${aisleLocation || 'Non spécifié'}\nTags: ${selectedTags.join(', ') || 'Aucun'}\n\n`;
        finalLongDesc = metaSummary + (longDescription || '');
      }
      formData.set('longDescription', finalLongDesc);

      // Ensure all captured camera photos and selected files are included
      formData.delete('images');
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      await createProduct(formData);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création.');
      setLoading(false);
    }
  };

  // Formatted preview summary for live shelf tag
  const displaySummary = shortDescription || [brand, volumeSize, aisleLocation].filter(Boolean).join(' • ');

  return (
    <div className="product-form-layout">
      {/* Left Column: Comprehensive Creation Form */}
      <div className="product-form-main">
        <form onSubmit={handleSubmit} className="product-form-card">
          <div className="form-card-header">
            <div>
              <h2 className="form-card-title">Fiche Article Supermarché</h2>
              <p className="form-card-subtitle">
                Remplissez les détails du produit pour l'enregistrer dans les rayons et en caisse.
              </p>
            </div>
            <button
              type="button"
              onClick={generateSku}
              className="btn btn-outline btn-sm sku-quick-gen-btn"
              title="Générer un code référence aléatoire"
            >
              <Barcode size={16} />
              <span>Générer Réf.</span>
            </button>
          </div>

          {error && (
            <div className="form-alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identification & Rayon */}
          <div className="form-section">
            <div className="form-section-title">
              <Package size={18} className="section-icon" />
              <span>1. Identification & Rayon</span>
            </div>

            <div className="form-grid grid-2">
              <div className="form-group col-span-2">
                <label className="form-label">
                  Nom de l'article <span className="text-req">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="form-control form-control-lg"
                  placeholder="Ex: Riz Parfumé Jasmin 5kg, Huile Végétale Dinor 1L..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Code-barres / Référence (SKU) <span className="text-req">*</span>
                </label>
                <div className="input-with-action">
                  <input
                    type="text"
                    name="sku"
                    required
                    className="form-control"
                    placeholder="Ex: ALI-849204 ou EAN 13"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="input-action-btn"
                    title="Générer automatiquement"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Rayon / Catégorie <span className="text-req">*</span>
                </label>
                <input
                  list="category-suggestions"
                  type="text"
                  name="category"
                  required
                  className="form-control"
                  placeholder="Sélectionnez ou tapez..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="category-chips-row">
              <span className="chips-label">Suggestions :</span>
              {existingCategories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`category-chip ${category === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Tarification & Calcul de Marge */}
          <div className="form-section">
            <div className="form-section-title">
              <DollarSign size={18} className="section-icon" />
              <span>2. Tarification & Marges Bénéficiaires</span>
            </div>

            <div className="form-grid grid-3">
              <div className="form-group">
                <label className="form-label">Prix d'Achat Unitaire (FCFA)</label>
                <input
                  type="number"
                  step="1"
                  name="purchasePrice"
                  className="form-control"
                  placeholder="Ex: 1 200"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(e.target.value ? parseFloat(e.target.value) : '')
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prix de Vente HT (FCFA)</label>
                <input
                  type="number"
                  step="1"
                  name="priceHT"
                  required
                  className="form-control"
                  placeholder="Ex: 1 270"
                  value={priceHT}
                  onChange={(e) => handlePriceHTChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Prix de Vente TTC (FCFA) <span className="text-req">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  name="priceTTC"
                  id="priceTTC"
                  required
                  className="form-control form-control-ttc"
                  placeholder="Ex: 1 500"
                  value={priceTTC}
                  onChange={(e) => handlePriceTTCChange(e.target.value)}
                />
              </div>
            </div>

            {/* Live Margin Indicator Card */}
            {numTTC > 0 && (
              <div className={`margin-indicator-card ${marginAmount >= 0 ? 'profit' : 'loss'}`}>
                <div className="margin-card-left">
                  <TrendingUp size={20} />
                  <div>
                    <div className="margin-card-label">Marge Brute Estimée</div>
                    <div className="margin-card-value">
                      {marginAmount >= 0 ? '+' : ''}
                      {marginAmount.toLocaleString('fr-FR')} FCFA / unité
                    </div>
                  </div>
                </div>
                <div className="margin-card-right">
                  <span className="margin-badge">
                    {numPurchase > 0 ? `${marginRate.toFixed(1)}% de marge` : 'Prix d’achat non renseigné'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Stock & Conditionnement */}
          <div className="form-section">
            <div className="form-section-title">
              <Box size={18} className="section-icon" />
              <span>3. Stock & Conditionnement</span>
            </div>

            <div className="form-grid grid-3">
              <div className="form-group">
                <label className="form-label">
                  Stock Initial (Rayon) <span className="text-req">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  min="0"
                  className="form-control"
                  placeholder="Ex: 24"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Seuil d'Alerte Rupture <span className="text-req">*</span>
                </label>
                <input
                  type="number"
                  name="minStock"
                  required
                  min="1"
                  className="form-control"
                  placeholder="Ex: 5"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unités par Carton / Casier</label>
                <input
                  type="number"
                  name="unitsPerCarton"
                  min="1"
                  className="form-control"
                  placeholder="Ex: 12 ou 24"
                  value={unitsPerCarton}
                  onChange={(e) => setUnitsPerCarton(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Photos & Visuels avec option Caméra */}
          <div className="form-section">
            <div className="form-section-title">
              <ImageIcon size={18} className="section-icon" />
              <span>4. Photo du Produit</span>
            </div>

            {/* Photo Action Options: Upload vs Live Camera */}
            <div className="photo-actions-grid">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="photo-action-btn camera-btn"
              >
                <Camera size={24} className="action-icon" />
                <div className="action-btn-text">
                  <strong>Prendre une Photo</strong>
                  <span>Ouvrir la caméra en direct</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="photo-action-btn native-camera-btn"
              >
                <Smartphone size={24} className="action-icon" />
                <div className="action-btn-text">
                  <strong>Appareil Photo Mobile</strong>
                  <span>Déclencher l’appareil photo</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="photo-action-btn gallery-btn"
              >
                <UploadCloud size={24} className="action-icon" />
                <div className="action-btn-text">
                  <strong>Choisir un Fichier</strong>
                  <span>Galerie ou dossier PC</span>
                </div>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp"
              className="hidden-file-input"
              onChange={handleImageChange}
            />
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden-file-input"
              onChange={handleImageChange}
            />

            {/* Previews Thumbnails */}
            {imagePreviews.length > 0 && (
              <div className="image-previews-grid">
                {imagePreviews.map((previewUrl, idx) => (
                  <div key={idx} className="preview-item">
                    <img src={previewUrl} alt={`Aperçu ${idx + 1}`} className="preview-img" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="preview-remove-btn"
                      title="Supprimer la photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Description & Détails Supermarché (Refonte Pro & Modulaire) */}
          <div className="form-section section-details-enhanced">
            <div
              className="form-section-title clickable-title"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            >
              <div className="title-left">
                <Layers size={18} className="section-icon" />
                <span>5. Informations Complémentaires & Emplacement</span>
                <span className="badge badge-optional">Optionnel</span>
              </div>
              <div className="title-toggle-icon">
                {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {isDetailsOpen && (
              <div className="details-accordion-content animate-fade-in">
                {/* Specific Supermarket Data Grid */}
                <div className="form-grid grid-3">
                  <div className="form-group">
                    <label className="form-label flex-label">
                      <Building2 size={15} color="#00796B" />
                      <span>Marque / Fabricant</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Nestlé, Coca-Cola, Dinor..."
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label flex-label">
                      <Scale size={15} color="#00796B" />
                      <span>Contenance / Format</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: 1L, 500g, 33cl, Pack de 6..."
                      value={volumeSize}
                      onChange={(e) => setVolumeSize(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label flex-label">
                      <MapPin size={15} color="#00796B" />
                      <span>Emplacement en Rayon</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Allée 2 - Étagère B, Tête gondole..."
                      value={aisleLocation}
                      onChange={(e) => setAisleLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quick Feature Badges / Tags */}
                <div className="form-group">
                  <label className="form-label flex-label">
                    <Tag size={15} color="#00796B" />
                    <span>Tags & Caractéristiques rapides</span>
                  </label>
                  <div className="quick-tags-container">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`quick-tag-chip ${isSelected ? 'tag-selected' : ''}`}
                        >
                          <span>{tag}</span>
                          {isSelected && <CheckCircle size={12} className="tag-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Notes & Instructions */}
                <div className="form-grid grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Description pour Ticket & Caisse
                    </label>
                    <input
                      type="text"
                      name="shortDescription"
                      className="form-control"
                      placeholder="Généré automatiquement si vide (Marque, format...)"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Notes internes & Conseils (Stock / Vente)
                    </label>
                    <textarea
                      name="longDescription"
                      className="form-control"
                      rows={2}
                      placeholder="Ex: Vérifier la date d'expiration, consigne bouteille 100 FCFA..."
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions-bar">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-outline"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Enregistrer l'article</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Interactive Shelf Card Preview */}
      <div className="product-form-preview-column">
        <div className="preview-sticky-card">
          <div className="preview-card-header">
            <Sparkles size={16} color="#00796B" />
            <span>Aperçu Étiquette & Caisse</span>
          </div>

          <div className="preview-product-card">
            <div className="preview-img-container">
              {imagePreviews.length > 0 ? (
                <img
                  src={imagePreviews[0]}
                  alt="Aperçu produit"
                  className="preview-card-image"
                />
              ) : (
                <div className="preview-card-placeholder">
                  <ShoppingBag size={48} color="#94A3B8" />
                  <span>Photo de l'article</span>
                </div>
              )}
              {category && <span className="preview-category-badge">{category}</span>}
              {aisleLocation && (
                <span className="preview-location-badge">
                  <MapPin size={11} />
                  <span>{aisleLocation}</span>
                </span>
              )}
            </div>

            <div className="preview-card-body">
              <div className="preview-card-sku-row">
                <span className="preview-card-sku">{sku || 'SKU-000000'}</span>
                {brand && <span className="preview-brand-tag">{brand}</span>}
              </div>

              <h3 className="preview-card-name">
                {name || 'Nom de votre article'}
              </h3>
              
              {displaySummary && (
                <p className="preview-card-desc">{displaySummary}</p>
              )}

              {/* Selected Tags preview */}
              {selectedTags.length > 0 && (
                <div className="preview-tags-row">
                  {selectedTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="preview-tag-mini">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="preview-card-price-row">
                <div>
                  <div className="preview-price-label">Prix de vente TTC</div>
                  <div className="preview-card-price">
                    {numTTC > 0 ? numTTC.toLocaleString('fr-FR') : '0'}{' '}
                    <span className="currency">FCFA</span>
                  </div>
                </div>

                <div className="preview-stock-badge">
                  <Box size={13} />
                  <span>{stock} en stock</span>
                </div>
              </div>

              {/* Profitability summary */}
              <div className="preview-profit-pill">
                <span>Marge : {marginAmount >= 0 ? '+' : ''}{marginAmount.toLocaleString('fr-FR')} FCFA</span>
                {numPurchase > 0 && <span className="profit-rate">({marginRate.toFixed(0)}%)</span>}
              </div>
            </div>
          </div>

          {/* Quick tips list */}
          <div className="preview-tips-card">
            <div className="tip-item">
              <CheckCircle size={14} color="#10B981" />
              <span>Visible instantanément sur la caisse tactile POS.</span>
            </div>
            <div className="tip-item">
              <CheckCircle size={14} color="#10B981" />
              <span>Alerte automatique dès que le stock descend à {minStock} unités.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          LIVE IN-BROWSER CAMERA MODAL
          ========================================== */}
      {isCameraOpen && (
        <div className="camera-modal-overlay" onClick={stopCamera}>
          <div
            className="camera-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="camera-modal-header">
              <div className="camera-title">
                <Camera size={20} color="#00796B" />
                <span>Prise de photo en direct</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="camera-close-btn"
                aria-label="Fermer la caméra"
              >
                <X size={20} />
              </button>
            </div>

            {cameraError ? (
              <div className="camera-error-message">
                <AlertCircle size={24} color="#DC2626" />
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="btn btn-primary btn-sm"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="camera-viewfinder-wrapper">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="camera-video-stream"
                />

                {/* Target overlay framing */}
                <div className="camera-framing-box" />

                {/* Camera controls */}
                <div className="camera-controls-bar">
                  <button
                    type="button"
                    onClick={switchCameraFacing}
                    className="camera-icon-action-btn"
                    title="Changer de caméra (avant/arrière)"
                  >
                    <RotateCcw size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="camera-shutter-btn"
                    title="Prendre la photo"
                  >
                    <div className="shutter-inner" />
                  </button>

                  <div style={{ width: 44 }} />
                </div>
              </div>
            )}

            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
