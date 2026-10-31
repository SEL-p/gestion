'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/actions/product';
import {
  Camera,
  Plus,
  X,
  RotateCcw,
  Smartphone,
  ChevronDown,
  Upload,
} from 'lucide-react';

interface ProductFormProps {
  existingCategories?: string[];
}

const COMMON_COMPANIES = [
  'Nestlé',
  'Unilever',
  'SIFCA / Sania',
  'Solibra',
  'Brassivoire',
  'Danone / Fan Milk',
  'Procter & Gamble (P&G)',
  'Colgate-Palmolive',
  'Cémoi Chocolatier',
  'Coca-Cola Bottling',
  'Guinness / Diageo',
  'Heineken',
  'Bracodi',
  'Grossiste Marché / Local',
  'Importation / Autre',
];

const CONTAINER_TYPES = [
  'Carton / Caisse (Gros)',
  'Pack / Fardeau',
  'Unité / Pièce (Détail)',
  'Sac (5kg, 25kg, 50kg)',
  'Bouteille / Flacon',
  'Boîte / Conserve / Bocal',
  'Sachet / Paquet',
  'Canette (Alu)',
  'Brique (Tetra Pak)',
  'Barquette / Pot',
  'Autre conditionnement',
];

const SUPERMARKET_CATEGORIES = [
  'Alimentaire & Épicerie',
  'Boissons & Jus',
  'Produits Frais & Laitiers',
  'Entretien & Ménage',
  'Hygiène, Beauté & Santé',
  'Boulangerie & Snacks',
  'Confiseries & Chocolats',
  'Bébé & Puériculture',
  'Bazar, Maison & Divers',
];

const MAX_PRODUCT_IMAGE_PAYLOAD_SIZE = 8 * 1024 * 1024;

async function prepareProductImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Utilisez une photo au format JPEG, PNG ou WebP.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Cette photo ne peut pas être préparée. Choisissez une image JPEG, PNG ou WebP.');
  }

  try {
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Impossible de préparer la photo sur cet appareil.');
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const encode = (type: string) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error('Impossible de compresser la photo. Réessayez avec une autre image.'));
          },
          type,
          0.82
        );
      });
    let blob = await encode('image/webp');
    if (blob.type !== 'image/webp' && blob.type !== 'image/jpeg') {
      blob = await encode('image/jpeg');
    }

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `product-photo.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

function describeCameraError(err: unknown): string {
  const { name, message } = (err ?? {}) as { name?: string; message?: string };

  switch (name) {
    case 'InsecureContextError':
      return message ?? 'La caméra nécessite une connexion sécurisée (HTTPS) ou un accès via localhost.';
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Accès à la caméra refusé. Dans Android, ouvrez Paramètres > Applications > ZEYNARMARKET > Autorisations > Appareil photo, puis choisissez « Autoriser ». Fermez et relancez l’application.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'Aucune caméra détectée sur cet appareil. Utilisez « Choisir dans la galerie ».';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La caméra est déjà utilisée par une autre application. Fermez-la puis réessayez.';
    default:
      return 'Impossible d’accéder à la caméra. Vérifiez les autorisations de votre appareil ou choisissez une image depuis la galerie.';
  }
}

export default function ProductForm({ existingCategories = [] }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [company, setCompany] = useState('Nestlé');
  const [category, setCategory] = useState(existingCategories[0] || 'Alimentaire & Épicerie');
  const [containerType, setContainerType] = useState('Carton / Caisse (Gros)');
  const [boxCapacity, setBoxCapacity] = useState<number | ''>(24);

  // Pricing
  const [boxPurchasePrice, setBoxPurchasePrice] = useState<number | ''>('');
  const [unitSalePrice, setUnitSalePrice] = useState<number | ''>('');

  // Stock Initial (Packs + Pièces détachées)
  const [stockPacks, setStockPacks] = useState<number | ''>('');
  const [stockLooseUnits, setStockLooseUnits] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number>(5);
  const [sku, setSku] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Images & Camera
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // In-browser stream modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraSessionRef = useRef(0);

  // Categories list merging defaults with database categories
  const categoriesList = Array.from(
    new Set([...SUPERMARKET_CATEGORIES, ...existingCategories])
  ).filter(Boolean);

  // Auto-calculated Unit Purchase Price (P. Achat pièce auto)
  const cap = typeof boxCapacity === 'number' && boxCapacity > 0 ? boxCapacity : 1;
  const isPackMode = cap > 1;
  const boxPrice = typeof boxPurchasePrice === 'number' ? boxPurchasePrice : 0;
  const autoUnitPurchasePrice = cap > 0 && boxPrice > 0 ? Math.round(boxPrice / cap) : 0;

  // Calcul du stock initial en direct
  const packsCount = typeof stockPacks === 'number' && stockPacks > 0 ? stockPacks : 0;
  const looseCount = typeof stockLooseUnits === 'number' && stockLooseUnits > 0 ? stockLooseUnits : 0;
  const totalCalculatedStock = isPackMode ? (packsCount * cap + looseCount) : (packsCount + looseCount);

  // Margin Calculation
  const salePrice = typeof unitSalePrice === 'number' ? unitSalePrice : 0;
  const hasValidPricing = salePrice > 0 && autoUnitPurchasePrice > 0;
  const marginAmount = hasValidPricing ? salePrice - autoUnitPurchasePrice : 0;
  const marginPercent = autoUnitPurchasePrice > 0 ? Math.round((marginAmount / autoUnitPurchasePrice) * 100) : 0;
  const isPositiveMargin = marginAmount > 0;

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setImageFiles([filesArray[0]]); // single main photo as shown in design
      setImagePreviews([URL.createObjectURL(filesArray[0])]);
      setShowPhotoModal(false);
    }
  };

  const removePhoto = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  // Camera Management
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraReady(false);
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    const session = cameraSessionRef.current + 1;
    cameraSessionRef.current = session;

    setCameraError(null);
    setIsCameraOpen(true);
    setShowPhotoModal(false);
    stopStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const insecure = new Error(
          'La caméra nécessite une connexion sécurisée (HTTPS) ou un accès via localhost.'
        );
        insecure.name = 'InsecureContextError';
        throw insecure;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (session !== cameraSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraStream(stream);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(describeCameraError(err));
    }
  };

  const stopCamera = () => {
    cameraSessionRef.current += 1;
    stopStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCameraReady) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setCameraError('La caméra n’est pas prête. Patientez un instant.');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Impossible de capturer la photo. Réessayez.');
          return;
        }
        const fileName = `boisson_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        setImageFiles([file]);
        setImagePreviews([URL.createObjectURL(file)]);
        stopCamera();
      },
      'image/jpeg',
      0.88
    );
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream || video.srcObject === cameraStream) return;

    video.srcObject = cameraStream;
    video.play().catch((err) => console.warn('Lecture du flux vidéo impossible:', err));
  }, [cameraStream, isCameraOpen]);

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
      if (!name.trim()) {
        throw new Error('Le nom du produit est obligatoire.');
      }
      if (!brand.trim()) {
        throw new Error('La marque est obligatoire.');
      }
      if (!unitSalePrice || Number(unitSalePrice) <= 0) {
        throw new Error('Le prix de vente pièce est obligatoire.');
      }

      const generatedSku = sku.trim() || `PRD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const safeUnitsPerCarton = typeof boxCapacity === 'number' && boxCapacity > 0 ? boxCapacity : 1;

      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('sku', generatedSku);
      formData.set('category', category || 'Alimentaire & Épicerie');
      formData.set('unitsPerCarton', String(safeUnitsPerCarton));
      formData.set('purchasePrice', String(autoUnitPurchasePrice || 0));
      formData.set('priceTTC', String(unitSalePrice));
      formData.set('priceHT', String(Math.round(Number(unitSalePrice) / 1.18)));

      // Stock initial calculé (Packs * Capacité + Pièces détachées)
      formData.set('stock', String(totalCalculatedStock));
      formData.set('minStock', String(minStock || 5));

      // Structured Descriptions for Supermarket
      const shortDesc = isPackMode
        ? `Marque: ${brand.trim()} • Pack de ${safeUnitsPerCarton} pcs • Stock: ${packsCount} pack(s) + ${looseCount} pc(s) (${totalCalculatedStock} total)`
        : `Marque: ${brand.trim()} • Type: ${containerType} • Stock: ${totalCalculatedStock} pcs`;
      formData.set('shortDescription', shortDesc);

      const longDesc = `[Fiche Article]\nProduit: ${name.trim()}\nRayon: ${category}\nMarque: ${brand.trim()}\nFournisseur: ${company}\nConditionnement: ${containerType}\nPièces par pack / colis: ${safeUnitsPerCarton} unités\nStock initial: ${isPackMode ? `${packsCount} packs + ${looseCount} pièces détachées = ` : ''}${totalCalculatedStock} pièces au total\nPrix d'achat du colis: ${boxPurchasePrice || 0} F\nPrix d'achat unitaire auto: ${autoUnitPurchasePrice} F\nPrix de vente pièce: ${unitSalePrice} F\nMarge estimée: ${marginAmount} F (${marginPercent}%)`;
      formData.set('longDescription', longDesc);

      // Compress and append image
      if (imageFiles.length > 0) {
        const prepared = await prepareProductImage(imageFiles[0]);
        formData.append('images', prepared);
      }

      await createProduct(formData);
      router.push('/products');
    } catch (err: any) {
      console.error('Erreur création produit:', err);
      setError(err.message || 'Une erreur est survenue lors de l’enregistrement.');
      setLoading(false);
    }
  };

  return (
    <div className="drink-form-wrapper">
      {/* Desktop Header bar (matches mobile top bar) */}
      <div className="drink-desktop-header">
        <button
          type="button"
          onClick={() => router.back()}
          className="drink-header-menu-btn"
          aria-label="Retour"
        >
          ←
        </button>
        <h1 className="drink-header-title">Ajouter un produit</h1>
        <Link href="/products" className="drink-header-cancel-btn">
          Annuler
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="drink-form-body">
        {error && (
          <div className="drink-error-alert animate-fade-in">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="drink-error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── 1. Carte Photo du produit ───────────────────────────────────── */}
        <div className="drink-card drink-photo-card">
          <div
            className="drink-photo-box"
            onClick={() => setShowPhotoModal(true)}
            role="button"
            tabIndex={0}
            title="Cliquez pour ajouter une photo"
          >
            {imagePreviews.length > 0 ? (
              <div className="drink-photo-preview-wrap">
                <img
                  src={imagePreviews[0]}
                  alt="Aperçu boisson"
                  className="drink-photo-img"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                  className="drink-photo-remove-btn"
                  title="Supprimer la photo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="drink-photo-placeholder">
                <div className="drink-camera-icon-wrap">
                  <Camera size={34} className="drink-camera-icon" />
                  <span className="drink-camera-badge-plus">
                    <Plus size={11} strokeWidth={3} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="drink-photo-info">
            <h3 className="drink-photo-title">Photo du produit</h3>
            <p className="drink-photo-subtitle">
              {imagePreviews.length > 0 ? '1 photo choisie' : 'Aucune photo choisie'}
            </p>
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="drink-add-photo-btn"
            >
              Ajouter une photo
            </button>
          </div>
        </div>

        {/* ── 2. Carte Informations de base ───────────────────────────────── */}
        <div className="drink-card">
          <div className="drink-card-header">
            <h2 className="drink-card-title">Informations de base</h2>
          </div>

          <div className="drink-fields-stack">
            {/* Nom du produit */}
            <div className="drink-input-group">
              <input
                type="text"
                name="name"
                required
                className="drink-input"
                placeholder="Nom du produit *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Marque */}
            <div className="drink-input-group">
              <input
                type="text"
                name="brand"
                required
                className="drink-input"
                placeholder="Marque *"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            {/* Compagnie */}
            <div className="drink-input-group drink-select-group">
              <select
                className="drink-select"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              >
                {COMMON_COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="drink-select-arrow" />
            </div>
          </div>
        </div>

        {/* ── 3. Carte Classification ─────────────────────────────────────── */}
        <div className="drink-card">
          <div className="drink-card-header">
            <h2 className="drink-card-title">Classification</h2>
          </div>

          <div className="drink-fields-stack">
            <div className="drink-grid-2">
              {/* Catégorie (Ca...) */}
              <div className="drink-input-group drink-select-group">
                <select
                  className="drink-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  title="Catégorie"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="drink-select-arrow" />
              </div>

              {/* Type (Ty...) */}
              <div className="drink-input-group drink-select-group">
                <select
                  className="drink-select"
                  value={containerType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setContainerType(newType);
                    if (
                      newType.includes('Unité') ||
                      newType.includes('Pièce') ||
                      newType.includes('Bouteille') ||
                      newType.includes('Bocal') ||
                      newType.includes('Canette') ||
                      newType.includes('Barquette')
                    ) {
                      setBoxCapacity(1);
                    } else if (newType.includes('Carton') || newType.includes('Caisse')) {
                      setBoxCapacity(24);
                    } else if (newType.includes('Pack') || newType.includes('Fardeau')) {
                      setBoxCapacity(6);
                    }
                  }}
                  title="Type de conditionnement"
                >
                  {CONTAINER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="drink-select-arrow" />
              </div>
            </div>

            {/* Capacité d'un pack / carton */}
            <div className="drink-input-group">
              <input
                type="number"
                min="1"
                required
                className="drink-input"
                placeholder="Nombre de pièces dans 1 pack / carton (ex: 24, 12, 6 ou 1) *"
                value={boxCapacity}
                onChange={(e) =>
                  setBoxCapacity(e.target.value ? parseInt(e.target.value, 10) : '')
                }
              />
            </div>
          </div>
        </div>

        {/* ── 4. Carte Stock Initial (Packs + Pièces au détail) ─────────────── */}
        <div className="drink-card">
          <div className="drink-card-header">
            <h2 className="drink-card-title">Stock Initial & Entrée en Stock</h2>
          </div>

          <div className="drink-fields-stack">
            <div className="drink-grid-2">
              {/* Nombre de packs / cartons */}
              <div className="drink-input-group">
                <input
                  type="number"
                  min="0"
                  className="drink-input"
                  placeholder={isPackMode ? "Nombre de packs / cartons entiers" : "Stock initial (pièces)"}
                  value={stockPacks}
                  onChange={(e) =>
                    setStockPacks(e.target.value ? parseInt(e.target.value, 10) : '')
                  }
                />
              </div>

              {/* Pièces détachées / individuelles en plus */}
              <div className="drink-input-group">
                <input
                  type="number"
                  min="0"
                  className="drink-input"
                  placeholder={isPackMode ? "Pièces détachées en plus (ex: 3)" : "Pièces supplémentaires"}
                  value={stockLooseUnits}
                  onChange={(e) =>
                    setStockLooseUnits(e.target.value ? parseInt(e.target.value, 10) : '')
                  }
                />
              </div>
            </div>

            {/* Récapitulatif dynamique et transparent du stock */}
            <div className="drink-stock-summary-card">
              <div className="drink-stock-summary-main">
                <span className="drink-stock-summary-label">Total en stock enregistré :</span>
                <strong className="drink-stock-summary-total">
                  {totalCalculatedStock} pièce{totalCalculatedStock > 1 ? 's' : ''}
                </strong>
              </div>

              {isPackMode && (
                <div className="drink-stock-summary-formula">
                  <span>Détail : </span>
                  <strong>{packsCount} pack{packsCount > 1 ? 's' : ''}</strong> de <strong>{cap} pcs</strong>
                  {looseCount > 0 && <> + <strong>{looseCount} pièce{looseCount > 1 ? 's' : ''} détachée{looseCount > 1 ? 's' : ''}</strong></>}
                  {' = '}
                  <strong>{totalCalculatedStock} pièces au total</strong>
                </div>
              )}

              <p className="drink-stock-summary-note">
                Ce produit est vendu à la pièce à la caisse. À chaque vente, le stock est déduit et le système calcule automatiquement le nombre de packs entiers restants et les pièces au détail.
              </p>
            </div>

            {/* Seuil d'alerte stock faible */}
            <div className="drink-input-group" style={{ maxWidth: '280px' }}>
              <input
                type="number"
                min="0"
                className="drink-input"
                placeholder="Seuil d'alerte stock faible (ex: 5)"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value ? parseInt(e.target.value, 10) : 5)}
              />
            </div>
          </div>
        </div>

        {/* ── 5. Carte Tarification ────────────────────────────────────────── */}
        <div className="drink-card">
          <div className="drink-card-header">
            <h2 className="drink-card-title">Tarification</h2>
          </div>

          <div className="drink-fields-stack">
            {/* Ligne 1 : P. Achat Colis / Gros * | P. Achat pièce auto */}
            <div className="drink-grid-2">
              <div className="drink-input-group drink-input-amber">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="drink-input drink-input-colored"
                  placeholder={isPackMode ? "P. Achat Pack / Carton (F) *" : "Prix d'achat unitaire (F) *"}
                  value={boxPurchasePrice}
                  onChange={(e) =>
                    setBoxPurchasePrice(e.target.value ? parseFloat(e.target.value) : '')
                  }
                />
              </div>

              <div className="drink-input-group drink-input-amber-soft">
                <input
                  type="text"
                  readOnly
                  className="drink-input drink-input-readonly"
                  placeholder="P. Achat pièce auto (F)"
                  value={
                    autoUnitPurchasePrice > 0
                      ? `${autoUnitPurchasePrice.toLocaleString('fr-FR')} F / pièce`
                      : ''
                  }
                />
              </div>
            </div>

            {/* Ligne 2 : Prix de vente pièce * | Marge */}
            <div className="drink-grid-2">
              <div className="drink-input-group drink-input-cyan">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className="drink-input drink-input-colored"
                  placeholder="Prix de vente à la pièce (F) *"
                  value={unitSalePrice}
                  onChange={(e) =>
                    setUnitSalePrice(e.target.value ? parseFloat(e.target.value) : '')
                  }
                />
              </div>

              {/* Boîte de Marge avec label flottant */}
              <div
                className={`drink-margin-box ${
                  isPositiveMargin ? 'drink-margin-positive' : 'drink-margin-neutral'
                }`}
              >
                <span className="drink-margin-label">Marge unitaire</span>
                <span className="drink-margin-value">
                  {hasValidPricing
                    ? `${marginAmount.toLocaleString('fr-FR')} F soit ${marginPercent}%`
                    : '0 F soit 0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Paramètres complémentaires (Code-barres / SKU) ──────────────── */}
        <div className="drink-advanced-toggle-wrap">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="drink-advanced-toggle-btn"
          >
            <span>{showAdvanced ? 'Masquer le code-barres / SKU' : '+ Code-barres / Référence SKU (Optionnel)'}</span>
            <ChevronDown
              size={15}
              style={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>

        {showAdvanced && (
          <div className="drink-card drink-advanced-card animate-fade-in">
            <div className="drink-card-header">
              <h2 className="drink-card-title">Code-barres & Identification</h2>
            </div>

            <div className="drink-fields-stack">
              <div className="drink-input-group">
                <input
                  type="text"
                  className="drink-input"
                  placeholder="Code-barres / SKU (Optionnel, généré automatiquement si vide)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Bouton Sticky de Création ───────────────────────────────────── */}
        <div className="drink-submit-bar">
          <button
            type="submit"
            disabled={loading}
            className="drink-submit-btn"
          >
            {loading ? (
              <span className="drink-submit-loading">
                <span className="drink-spinner" />
                Enregistrement en cours...
              </span>
            ) : (
              <span>Créer le Produit</span>
            )}
          </button>
        </div>
      </form>

      {/* ── Modal Choix Photo (Caméra ou Galerie) ───────────────────────── */}
      {showPhotoModal && (
        <div className="drink-modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div
            className="drink-modal-sheet animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drink-sheet-handle" />
            <div className="drink-sheet-header">
              <h3 className="drink-sheet-title">Photo du produit</h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="drink-sheet-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drink-sheet-options">
              {/* Option 1 : Appareil Photo en direct */}
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false);
                  startCamera('environment');
                }}
                className="drink-sheet-option-btn"
              >
                <span className="drink-sheet-option-icon">
                  <Camera size={22} />
                </span>
                <div className="drink-sheet-option-text">
                  <strong>Prendre une photo (Caméra)</strong>
                  <small>Capture directe avec la caméra de l'appareil</small>
                </div>
              </button>

              {/* Option 2 : Caméra Native Mobile (Android capture) */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="drink-sheet-option-btn"
              >
                <span className="drink-sheet-option-icon">
                  <Smartphone size={22} />
                </span>
                <div className="drink-sheet-option-text">
                  <strong>Appareil Photo Mobile Natif</strong>
                  <small>Ouvre l'application caméra du téléphone</small>
                </div>
              </button>

              {/* Option 3 : Choisir dans la Galerie / Fichiers */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="drink-sheet-option-btn"
              >
                <span className="drink-sheet-option-icon">
                  <Upload size={22} />
                </span>
                <div className="drink-sheet-option-text">
                  <strong>Choisir dans la galerie</strong>
                  <small>Importer une image JPEG, PNG ou WebP</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Caméra Plein Écran (WebRTC Stream) ─────────────────────── */}
      {isCameraOpen && (
        <div className="drink-camera-overlay">
          <div className="drink-camera-modal">
            <div className="drink-camera-top">
              <span>Alignez la bouteille ou le casier</span>
              <button
                type="button"
                onClick={stopCamera}
                className="drink-camera-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drink-camera-viewport">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setIsCameraReady(true)}
                className="drink-camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div className="drink-camera-target-guide" />

              {cameraError && (
                <div className="drink-camera-error-banner">
                  <p>{cameraError}</p>
                </div>
              )}
            </div>

            <div className="drink-camera-bottom-controls">
              <button
                type="button"
                onClick={switchCameraFacing}
                className="drink-camera-action-btn"
                title="Changer de caméra"
              >
                <RotateCcw size={22} />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="drink-camera-shutter-btn"
                title="Prendre la photo"
              >
                <div className="drink-shutter-inner" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  nativeCameraInputRef.current?.click();
                }}
                className="drink-camera-action-btn"
                title="Ouvrir l'appareil photo du téléphone"
              >
                <Smartphone size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
    </div>
  );
}
