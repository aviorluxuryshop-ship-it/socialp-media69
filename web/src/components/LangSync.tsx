'use client';

import { useEffect } from 'react';

/**
 * Keeps `<html lang>` correct per locale.
 *
 * The root layout is shared across a static export, so it can only carry one
 * literal lang attribute. This corrects it on the client for assistive tech and
 * for correct hyphenation/quotation rules.
 */
export function LangSync({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
