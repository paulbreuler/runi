/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { NetworkHistoryEntry } from '@/types/history';
import { generateCurlCommand } from '@/utils/curl';

/**
 * Generate a cURL command from a network history entry.
 * Re-exports the existing curl utility for consistency.
 *
 * @param entry - The network history entry to convert
 * @returns A cURL command string that reproduces the request
 */
export function generateCurlCode(entry: NetworkHistoryEntry): string {
  return generateCurlCommand(entry);
}
