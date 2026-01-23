/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TLSTab component
 * @description TLS tab for expanded panel - displays TLS certificate and connection information
 */

import { useMemo } from 'react';
import { TLSPanel } from './TLSPanel';
import type { NetworkHistoryEntry } from '@/types/history';
import type { CertificateData } from '@/types/certificate';

export interface TLSTabProps {
  /** Network history entry */
  entry: NetworkHistoryEntry;
  /** TLS certificate data (null if not available or HTTP connection) */
  certificate: CertificateData | null | undefined;
  /** TLS protocol version (e.g., "TLS 1.2", "TLS 1.3") (optional) */
  protocolVersion?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TLSTab component that displays TLS certificate and connection information.
 *
 * Extracts TLS handshake timing from the entry and displays it along with
 * certificate details in the TLSPanel.
 *
 * @example
 * ```tsx
 * <TLSTab entry={historyEntry} certificate={certData} protocolVersion="TLS 1.3" />
 * ```
 */
export const TLSTab = ({
  entry,
  certificate,
  protocolVersion,
  className,
}: TLSTabProps): React.ReactElement => {
  const tlsHandshakeTime = useMemo(() => {
    return entry.response.timing.tls_ms ?? null;
  }, [entry.response.timing.tls_ms]);

  return (
    <TLSPanel
      certificate={certificate}
      tlsHandshakeTime={tlsHandshakeTime}
      protocolVersion={protocolVersion}
      className={className}
    />
  );
};
