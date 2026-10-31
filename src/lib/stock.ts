/**
 * Utilitaires de calcul et d'affichage des stocks pour produits vendus à la pièce
 * avec conditionnement par packs / cartons / casiers / fardeaux.
 */

export interface StockBreakdown {
  totalUnits: number;
  unitsPerPack: number;
  fullPacks: number;
  looseUnits: number;
  isPack: boolean;
  summaryText: string;
  detailedText: string;
  badgeText: string;
  shortText: string;
}

export function calculateStockBreakdown(stock: number, unitsPerPack: number = 1): StockBreakdown {
  const safeStock = Math.max(0, Math.floor(stock || 0));
  const safeUnitsPerPack = Math.max(1, Math.floor(unitsPerPack || 1));
  const isPack = safeUnitsPerPack > 1;

  if (!isPack) {
    return {
      totalUnits: safeStock,
      unitsPerPack: 1,
      fullPacks: safeStock,
      looseUnits: 0,
      isPack: false,
      summaryText: `${safeStock} pièce${safeStock > 1 ? 's' : ''}`,
      detailedText: `${safeStock} pièce${safeStock > 1 ? 's' : ''} au total`,
      badgeText: `${safeStock} pcs`,
      shortText: `${safeStock} pcs`,
    };
  }

  const fullPacks = Math.floor(safeStock / safeUnitsPerPack);
  const looseUnits = safeStock % safeUnitsPerPack;

  let summaryText = '';
  if (safeStock === 0) {
    summaryText = 'Rupture (0 pièce)';
  } else if (fullPacks > 0 && looseUnits > 0) {
    summaryText = `${fullPacks} pack${fullPacks > 1 ? 's' : ''} et ${looseUnits} pc${looseUnits > 1 ? 's' : ''} (${safeStock} au total)`;
  } else if (fullPacks > 0 && looseUnits === 0) {
    summaryText = `${fullPacks} pack${fullPacks > 1 ? 's' : ''} complet${fullPacks > 1 ? 's' : ''} (${safeStock} au total)`;
  } else {
    summaryText = `${looseUnits} pièce${looseUnits > 1 ? 's' : ''} (${safeStock} au total)`;
  }

  let detailedText = '';
  if (safeStock === 0) {
    detailedText = 'Rupture de stock (0 pièce)';
  } else if (fullPacks > 0 && looseUnits > 0) {
    detailedText = `${fullPacks} pack${fullPacks > 1 ? 's' : ''} de ${safeUnitsPerPack} + ${looseUnits} pièce${looseUnits > 1 ? 's' : ''} = Total : ${safeStock} pièces`;
  } else if (fullPacks > 0 && looseUnits === 0) {
    detailedText = `${fullPacks} pack${fullPacks > 1 ? 's' : ''} de ${safeUnitsPerPack} = Total : ${safeStock} pièces`;
  } else {
    detailedText = `${looseUnits} pièce${looseUnits > 1 ? 's' : ''} restante${looseUnits > 1 ? 's' : ''} = Total : ${safeStock} pièces`;
  }

  const badgeText = safeStock === 0
    ? '0 pc'
    : (fullPacks > 0
        ? `${fullPacks} pk${fullPacks > 1 ? 's' : ''}${looseUnits > 0 ? ` + ${looseUnits}` : ''}`
        : `${looseUnits} pcs`);

  const shortText = safeStock === 0
    ? 'Rupture'
    : (fullPacks > 0
        ? `${fullPacks} pack${fullPacks > 1 ? 's' : ''}${looseUnits > 0 ? ` + ${looseUnits} pcs` : ''}`
        : `${looseUnits} pcs`);

  return {
    totalUnits: safeStock,
    unitsPerPack: safeUnitsPerPack,
    fullPacks,
    looseUnits,
    isPack,
    summaryText,
    detailedText,
    badgeText,
    shortText,
  };
}
