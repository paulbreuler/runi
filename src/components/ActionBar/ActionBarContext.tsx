import { createContext, useContext } from 'react';

/**
 * Responsive variants for ActionBar components.
 * - `full`: All controls with full labels (>800px by default)
 * - `compact`: Controls with shorter labels (600-800px by default)
 * - `icon`: Icon-only controls with tooltips (<600px by default)
 */
export type ActionBarVariant = 'full' | 'compact' | 'icon';

interface ActionBarContextValue {
  /** Current responsive variant based on container width */
  variant: ActionBarVariant;
}

const ActionBarContext = createContext<ActionBarContextValue | null>(null);

/**
 * Hook to access the ActionBar context.
 * Must be used within an ActionBar component.
 *
 * @returns The ActionBar context value containing the current variant
 * @throws Error if used outside of ActionBar
 */
export const useActionBarContext = (): ActionBarContextValue => {
  const context = useContext(ActionBarContext);
  if (context === null) {
    throw new Error('useActionBarContext must be used within an ActionBar');
  }
  return context;
};

/**
 * Hook to optionally access the ActionBar context.
 * Returns null if used outside of ActionBar.
 *
 * @returns The ActionBar context value or null
 */
export const useOptionalActionBarContext = (): ActionBarContextValue | null => {
  return useContext(ActionBarContext);
};

export { ActionBarContext };
