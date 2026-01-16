import { useState, useEffect } from 'react';
import { createCompactQuery, createStandardQuery } from '@/utils/responsive';

export function useResponsive() {
  const [isCompact, setIsCompact] = useState(false);
  const [isStandard, setIsStandard] = useState(false);
  const [isSpacious, setIsSpacious] = useState(true);

  useEffect(() => {
    const compactQuery = createCompactQuery();
    const standardQuery = createStandardQuery();

    const updateCompact = () => {
      setIsCompact(compactQuery.matches);
    };
    const updateStandard = () => {
      setIsStandard(standardQuery.matches);
    };

    // Initial values
    updateCompact();
    updateStandard();
    setIsSpacious(!compactQuery.matches && !standardQuery.matches);

    // Listen for changes
    if (typeof window !== 'undefined') {
      const compactMq = window.matchMedia(`(max-width: 767px)`);
      const standardMq = window.matchMedia(
        `(min-width: 768px) and (max-width: 1023px)`
      );

      const handleCompactChange = (e: MediaQueryListEvent) => {
        setIsCompact(e.matches);
        setIsSpacious(!e.matches && !standardMq.matches);
      };
      const handleStandardChange = (e: MediaQueryListEvent) => {
        setIsStandard(e.matches);
        setIsSpacious(!compactMq.matches && !e.matches);
      };

      if (compactMq.addEventListener) {
        compactMq.addEventListener('change', handleCompactChange);
        standardMq.addEventListener('change', handleStandardChange);
        return () => {
          compactMq.removeEventListener('change', handleCompactChange);
          standardMq.removeEventListener('change', handleStandardChange);
        };
      } else {
        return undefined;
      }
    }
    return undefined;
  }, []);

  return { isCompact, isStandard, isSpacious };
}
