'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  categoryName: string;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  link: string;
}

const CATEGORY_SLIDES: Slide[] = [
  {
    id: 1,
    categoryName: 'Boissons & Jus',
    image: '/banners/category-boissons.webp?v=2',
    title: 'RAYON BOISSONS & JUS',
    subtitle: 'Bières, sodas, jus de fruits & eau minérale • Carton & détail',
    badge: 'BOISSONS',
    link: '/products?category=Boissons+%26+Jus',
  },
  {
    id: 2,
    categoryName: 'Alimentaire & Épicerie',
    image: '/banners/category-epicerie.webp?v=2',
    title: 'ALIMENTAIRE & ÉPICERIE',
    subtitle: 'Riz, pâtes, conserves, huiles et condiments aux meilleurs prix',
    badge: 'ÉPICERIE',
    link: '/products?category=Alimentaire+%26+%C3%89picerie',
  },
  {
    id: 3,
    categoryName: 'Produits Frais & Laitiers',
    image: '/banners/category-frais.webp?v=2',
    title: 'PRODUITS FRAIS & LAITIERS',
    subtitle: 'Laits, fromages, yaourts, beurres & charcuterie fraîche',
    badge: 'PRODUITS FRAIS',
    link: '/products?category=Produits+Frais+%26+Laitiers',
  },
  {
    id: 4,
    categoryName: 'Entretien & Ménage',
    image: '/banners/category-entretien.webp?v=2',
    title: 'ENTRETIEN & MÉNAGE',
    subtitle: 'Lessives, savons, javel, nettoyants sols & vaisselle',
    badge: 'ENTRETIEN',
    link: '/products?category=Entretien+%26+M%C3%A9nage',
  },
  {
    id: 5,
    categoryName: 'Hygiène & Beauté',
    image: '/banners/category-hygiene.webp?v=2',
    title: 'HYGIÈNE & BEAUTÉ',
    subtitle: 'Soins corporels, savons de toilette, dentifrices & parfumerie',
    badge: 'BEAUTÉ & SOINS',
    link: '/products?category=Hygi%C3%A8ne+%26+Beaut%C3%A9',
  },
  {
    id: 6,
    categoryName: 'Boulangerie & Snacks',
    image: '/banners/category-boulangerie.webp?v=2',
    title: 'BOULANGERIE & SNACKS',
    subtitle: 'Biscuits, pains, chocolats, chips & goûters gourmands',
    badge: 'SNACKS & GOUTERS',
    link: '/products?category=Boulangerie+%26+Snacks',
  },
];

export default function HomeCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CATEGORY_SLIDES.length);
    }, 4500);
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % CATEGORY_SLIDES.length);
      startAutoPlay();
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + CATEGORY_SLIDES.length) % CATEGORY_SLIDES.length);
      startAutoPlay();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx % CATEGORY_SLIDES.length);
    startAutoPlay();
  };

  const currentSlide = CATEGORY_SLIDES[currentIndex];

  return (
    <div className="home-carousel-wrapper">
      <div
        className="home-carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href={currentSlide.link}
          className="home-carousel-card"
          title={`Accéder au rayon ${currentSlide.categoryName}`}
        >
          <div className="home-carousel-img-wrap">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="home-carousel-img"
            />
          </div>
        </Link>
      </div>

      {/* Pagination Dots (One per category) */}
      <div className="home-carousel-dots" aria-label="Pagination des rayons">
        {CATEGORY_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`carousel-dot ${isActive ? 'is-active' : ''}`}
              aria-label={`Voir le rayon ${slide.categoryName}`}
              title={slide.categoryName}
            />
          );
        })}
      </div>
    </div>
  );
}
