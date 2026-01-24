/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';

/**
 * Return type for useMemoryWarning hook.
 */
export interface UseMemoryWarningReturn {
  /** Whether the memory warning has been dismissed by the user */
  isDismissed: boolean;
  /** Function to dismiss the memory warning */
  dismiss: () => void;
}

/**
 * Hook that tracks whether the memory warning has been dismissed.
 *
 * @returns Object with isDismissed state and dismiss function
 */
export function useMemoryWarning(): UseMemoryWarningReturn {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const dismiss = (): void => {
    setIsDismissed(true);
  };

  return {
    isDismissed,
    dismiss,
  };
}
