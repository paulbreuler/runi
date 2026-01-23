/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect } from 'react';
import { createCompactQuery, createStandardQuery } from '@/utils/responsive';

interface ResponsiveState {
  isCompact: boolean;
  isStandard: boolean;
  isSpacious: boolean;
}

export function useResponsive(): ResponsiveState {
  const [isCompact, setIsCompact] = useState(false);
  const [isStandard, setIsStandard] = useState(false);
  const [isSpacious, setIsSpacious] = useState(true);

  useEffect((): (() => void) | undefined => {
    const compactQuery = createCompactQuery();
    const standardQuery = createStandardQuery();

    const updateCompact = (): void => {
      setIsCompact(compactQuery.matches);
    };
    const updateStandard = (): void => {
      setIsStandard(standardQuery.matches);
    };

    // Initial values
    updateCompact();
    updateStandard();
    setIsSpacious(!compactQuery.matches && !standardQuery.matches);

    // Listen for changes
    if (typeof window !== 'undefined') {
      const compactMq = window.matchMedia(`(max-width: 767px)`);
      const standardMq = window.matchMedia(`(min-width: 768px) and (max-width: 1023px)`);

      const handleCompactChange = (e: MediaQueryListEvent): void => {
        setIsCompact(e.matches);
        setIsSpacious(!e.matches && !standardMq.matches);
      };
      const handleStandardChange = (e: MediaQueryListEvent): void => {
        setIsStandard(e.matches);
        setIsSpacious(!compactMq.matches && !e.matches);
      };

      compactMq.addEventListener('change', handleCompactChange);
      standardMq.addEventListener('change', handleStandardChange);
      return (): void => {
        compactMq.removeEventListener('change', handleCompactChange);
        standardMq.removeEventListener('change', handleStandardChange);
      };
    }
    return undefined;
  }, []);

  return { isCompact, isStandard, isSpacious };
}
