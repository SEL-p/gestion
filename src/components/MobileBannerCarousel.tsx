'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  bgGradient: string;
  accentColor: string;
  link: string;
  icon: React.ReactNode;
}

const defaultSlides: BannerSlide[] = [
  {
    id: 'promo-1',
    badge: '⚡ CAISSE TACTILE',
    title: 'Encaissement Ultra-Rapide',
    subtitle: 'Scannez vos articles au code-barres et validez les tickets en 1 clic.',
    bgGradient: 'linear-gradient(135deg, #004D40 0%, #00796B 100%)',
    accentColor: '#48BB78',
    link: '/pos',
    icon: <ShoppingCart size={24} color="#ffffff" />,
  },
  {
    id: 'promo-2',
    badge: '🛍️ ARRIVAGES & RAYONS',
    title: 'Gestion des Rayons & Stocks',
    subtitle: 'Suivez vos stocks en temps réel et recevez des alertes avant rupture.',
    bgGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    accentColor: '#60A5FA',
    link: '/products',
    icon: <Sparkles size={24} color="#ffffff" />,
  },
  {
    id: 'promo-3',
    badge: '⚠️ GESTION FLUIDE',
    title: 'Inventaire & Prix de Vente',
    subtitle: 'Ajustez vos prix, visualisez vos marges et configurez vos remises.',
    bgGradient: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)',
    accentColor: '#FDBA74',
    link: '/alerts',
    icon: <AlertTriangle size={24} color="#ffffff" />,
  },
];

export default function MobileBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % defaultSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mobile-carousel-wrapper">
      <div
        className="mobile-carousel-slider"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {defaultSlides.map((slide) => (
          <div
            key={slide.id}
            className="mobile-carousel-card"
            style={{ background: slide.bgGradient }}
          >
            <div className="carousel-badge badge rounded-pill bg-white bg-opacity-25 text-white fw-bold px-3 py-1 mb-2 d-inline-flex align-items-center gap-1">{slide.badge}</div>
            <h3 className="carousel-title fs-5 fw-extrabold mb-1">{slide.title}</h3>
            <p className="carousel-subtitle small opacity-90 mb-3">{slide.subtitle}</p>

            <Link href={slide.link} className="carousel-action-btn btn btn-light rounded-pill btn-sm fw-bold shadow-sm d-inline-flex align-items-center gap-2 px-3 text-dark">
              <span>Accéder</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="carousel-dots">
        {defaultSlides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`carousel-dot ${currentIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Aller à la slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
