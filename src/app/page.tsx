import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HomeCarousel from '@/components/HomeCarousel';
import {
  Info,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayRevenue = 0;
  let todayOrdersCount = 0;
  let lowStockCount = 0;
  let storeSettings: any = null;

  try {
    const [orders, lowStock, settings] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: today },
          status: 'COMPLETED',
        },
        select: {
          totalTTC: true,
        },
      }),
      prisma.product.count({
        where: {
          stock: { lte: 5 },
        },
      }),
      prisma.storeSettings.findFirst(),
    ]);

    todayOrdersCount = orders.length;
    todayRevenue = orders.reduce((sum, o) => sum + (o.totalTTC || 0), 0);
    lowStockCount = lowStock;
    storeSettings = settings;
  } catch (err) {
    console.error('Error fetching home stats:', err);
  }

  const newsItems = [
    {
      id: 1,
      image: '/banners/news-maquis.jpg',
      title: "Côte d'Ivoire : Des maquis seront fermés à partir de ce mardi, voici ...",
      description: "Les boîtes de nuit, restaurants, hôtels et autres espaces de loisirs non conformes aux normes...",
      date: 'Il y a 10 mois',
      link: '/history',
    },
    {
      id: 2,
      image: '/banners/promo-fresh.jpg',
      title: 'Abidjan compte 43 000 maquis et bars (préfet)',
      description: 'Abidjan, la capitale économique ivoirienne compte 43 000 maquis, buvettes et débits de boisson...',
      date: 'Il y a 1 an',
      link: '/products',
    },
    {
      id: 3,
      image: '/banners/promo-ivoire.jpg',
      title: 'Promotion Brasseries : Remises exceptionnelles sur les casiers',
      description: 'Profitez de nos offres exclusives sur les cartons et casiers de bières et jus en magasin...',
      date: "Aujourd'hui",
      link: '/pos',
    },
  ];

  return (
    <div className="home-screen-page">
      {/* ── 1. Promotional Billboard Carousel ──────────────────────────────── */}
      <section className="home-carousel-section">
        <HomeCarousel />
      </section>

      {/* ── 2. Four Quick Action Cards (Boisson, Stock, Vente, Facture) ────── */}
      <section className="home-actions-section">
        <div className="home-actions-row">
          {/* Action 1: Boisson */}
          <Link
            href="/products?category=Boissons+%26+Jus"
            className="home-action-btn"
            title="Rayon Boissons"
          >
            <div className="home-action-icon-box icon-box-purple">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9333EA"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 2h6v3l-2 2v2a5 5 0 0 1 4 5v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a5 5 0 0 1 4-5V7L9 5V2z" />
                <line x1="9" y1="2" x2="15" y2="2" />
                <line x1="10" y1="13" x2="14" y2="13" />
              </svg>
            </div>
            <span className="home-action-label">Boisson</span>
          </Link>

          {/* Action 2: Stock */}
          <Link href="/alerts" className="home-action-btn" title="Alertes et Stock">
            <div className="home-action-icon-box icon-box-green">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16A34A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="8" width="18" height="13" rx="2" />
                <path d="M3 8l9-5 9 5" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="home-action-label">Stock</span>
          </Link>

          {/* Action 3: Vente */}
          <Link href="/pos" className="home-action-btn" title="Caisse & Vente">
            <div className="home-action-icon-box icon-box-amber">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <span className="home-action-label">Vente</span>
          </Link>

          {/* Action 4: Facture */}
          <Link href="/history" className="home-action-btn" title="Historique & Factures">
            <div className="home-action-icon-box icon-box-blue">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <span className="home-action-label">Facture</span>
          </Link>
        </div>
      </section>

      {/* ── 3. Helper / Guidance Banner ────────────────────────────────────── */}
      <section className="home-guidance-section">
        <div className="home-guidance-pill">
          <Info size={19} className="guidance-icon" />
          <p className="guidance-text">
            Pour commencer, cliquez sur <strong>&ldquo;Boisson&rdquo;</strong> puis sélectionnez vos produits.
          </p>
        </div>
      </section>

      {/* ── 4. Actualités et Annonces Section ─────────────────────────────── */}
      <section className="home-news-section">
        <h2 className="home-news-heading">Actualités et annonces</h2>

        <div className="home-news-list">
          {newsItems.map((item) => (
            <Link key={item.id} href={item.link} className="home-news-card">
              <div className="home-news-thumb-wrap">
                <img
                  src={item.image}
                  alt={item.title}
                  className="home-news-thumb"
                />
              </div>

              <div className="home-news-body">
                <h3 className="home-news-title">{item.title}</h3>
                <p className="home-news-desc">{item.description}</p>
                <div className="home-news-footer">
                  <span className="home-news-time">
                    <Clock size={12} /> {item.date}
                  </span>
                  <ChevronRight size={16} className="home-news-arrow" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. Discreet Daily Turnover Summary ─────────────────────────────── */}
      <section className="home-turnover-summary">
        <div className="home-turnover-card">
          <div className="home-turnover-left">
            <span className="home-turnover-label">Point du jour</span>
            <strong className="home-turnover-val">
              {todayRevenue.toLocaleString('fr-FR')} FCFA
            </strong>
            <span className="home-turnover-sub">
              {todayOrdersCount} vente{todayOrdersCount > 1 ? 's' : ''} enregistrée{todayOrdersCount > 1 ? 's' : ''}
            </span>
          </div>

          <Link href="/pos" className="home-turnover-btn">
            <ShoppingCart size={16} />
            <span>Caisse</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
