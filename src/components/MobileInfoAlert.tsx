'use client';

import React from 'react';
import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';

interface MobileInfoAlertProps {
  message?: string;
  actionText?: string;
  actionHref?: string;
}

export default function MobileInfoAlert({
  message = 'Pour commencer une transaction, appuyez sur "Vente" puis scannez ou choisissez vos articles.',
  actionText,
  actionHref,
}: MobileInfoAlertProps) {
  return (
    <div className="mobile-info-banner">
      <div className="mobile-info-icon">
        <Info size={18} color="#00796B" />
      </div>
      <div className="mobile-info-text">
        <span>{message}</span>
        {actionText && actionHref && (
          <Link href={actionHref} className="mobile-info-link">
            <span>{actionText}</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
