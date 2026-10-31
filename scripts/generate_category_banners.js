const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const bannersDir = path.join(__dirname, '..', 'public', 'banners');
const WIDTH = 1200;
const HEIGHT = 675;

const categories = [
  {
    key: 'boissons',
    sourceFile: 'promo-ivoire.jpg',
    outFile: 'category-boissons.webp',
    badgeText: 'RAYON BOISSONS & JUS',
    badgeColor1: '#EA580C',
    badgeColor2: '#F97316',
    title: 'BIÈRES, SODAS & JUS FRAIS',
    subtitle: 'Tarifs grossistes au carton & vente au détail • Toujours frais !',
    subColor: '#FEF08A',
  },
  {
    key: 'epicerie',
    sourceFile: 'promo-fresh.jpg',
    outFile: 'category-epicerie.webp',
    badgeText: 'ALIMENTAIRE & ÉPICERIE',
    badgeColor1: '#16A34A',
    badgeColor2: '#22C55E',
    title: 'LE CHOIX & LA QUALITÉ AU QUOTIDIEN',
    subtitle: 'Riz, pâtes, conserves, huiles et condiments aux meilleurs prix',
    subColor: '#86EFAC',
  },
  {
    key: 'frais',
    sourceFile: 'promo-frais.jpg',
    outFile: 'category-frais.webp',
    badgeText: 'PRODUITS FRAIS & LAITIERS',
    badgeColor1: '#059669',
    badgeColor2: '#10B981',
    title: 'LAITS, YAOURTS & FROMAGES FRAIS',
    subtitle: 'Arrivage du jour garanti • Chaîne du froid 100% maîtrisée',
    subColor: '#6EE7B7',
  },
  {
    key: 'entretien',
    sourceFile: 'promo-entretien.jpg',
    outFile: 'category-entretien.webp',
    badgeText: 'ENTRETIEN & MÉNAGE',
    badgeColor1: '#0284C7',
    badgeColor2: '#38BDF8',
    title: 'POUR UNE MAISON ÉCLATANTE',
    subtitle: 'Ariel, Omo, Persil, Javel et nettoyants multi-surfaces en promo',
    subColor: '#7DD3FC',
  },
  {
    key: 'hygiene',
    sourceFile: 'promo-hygiene.jpg',
    outFile: 'category-hygiene.webp',
    badgeText: 'HYGIÈNE & BEAUTÉ',
    badgeColor1: '#E11D48',
    badgeColor2: '#F43F5E',
    title: 'SOINS, CRÈMES & BEAUTÉ DU CORPS',
    subtitle: 'Savons parfumés, shampooings et soins hydratants au meilleur prix',
    subColor: '#FDA4AF',
  },
  {
    key: 'boulangerie',
    sourceFile: 'promo-boulangerie.jpg',
    outFile: 'category-boulangerie.webp',
    badgeText: 'BOULANGERIE & SNACKS',
    badgeColor1: '#D97706',
    badgeColor2: '#F59E0B',
    title: 'GOÛTERS, PAINS & GOURMANDISES',
    subtitle: 'Viennoiseries, biscuits, chips salées et chocolats pour vos encas',
    subColor: '#FDE68A',
  },
];

async function generateAllPhotoBanners() {
  console.log('Generating photographic banners for all categories with sharp...');

  for (const cat of categories) {
    const srcPath = path.join(bannersDir, cat.sourceFile);
    const destPath = path.join(bannersDir, cat.outFile);

    if (!fs.existsSync(srcPath)) {
      console.warn(`Source file not found: ${srcPath}`);
      continue;
    }

    const safeBadge = cat.badgeText.replace(/&/g, '&amp;');
    const safeTitle = cat.title.replace(/&/g, '&amp;');
    const safeSubtitle = cat.subtitle.replace(/&/g, '&amp;');

    const badgeWidth = Math.max(260, cat.badgeText.length * 12 + 40);

    const overlaySvg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.05" />
            <stop offset="40%" stop-color="#000000" stop-opacity="0.25" />
            <stop offset="75%" stop-color="#000000" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#0A0F1D" stop-opacity="0.96" />
          </linearGradient>
          <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${cat.badgeColor1}" />
            <stop offset="100%" stop-color="${cat.badgeColor2}" />
          </linearGradient>
        </defs>
        
        <!-- Dark gradient overlay for text contrast -->
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gradBottom)" />
        
        <!-- Top Category Pill Badge -->
        <rect x="50" y="45" width="${badgeWidth}" height="48" rx="24" fill="url(#badgeGrad)" />
        <text x="${50 + badgeWidth / 2}" y="76" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="19" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${safeBadge}</text>
        
        <!-- Bottom Banner Title & Subtitle -->
        <text x="50" y="555" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" letter-spacing="-0.5">${safeTitle}</text>
        <text x="50" y="605" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="23" fill="${cat.subColor}">${safeSubtitle}</text>
      </svg>
    `;

    await sharp(srcPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .webp({ quality: 90 })
      .toFile(destPath);

    console.log(`✓ ${cat.outFile} generated successfully from ${cat.sourceFile}`);
  }

  console.log('All 6 category photographic banners have been generated!');
}

generateAllPhotoBanners().catch(console.error);
