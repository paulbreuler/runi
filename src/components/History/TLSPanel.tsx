/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TLSPanel component
 * @description Panel that displays TLS certificate information and connection details
 */

import { cn } from '@/utils/cn';
import { CertificateInfo } from './CertificateInfo';
import type { CertificateData } from '@/types/certificate';
import { EmptyState } from '@/components/ui/EmptyState';

export interface TLSPanelProps {
  /** TLS certificate data (null if not available or HTTP connection) */
  certificate: CertificateData | null | undefined;
  /** TLS handshake time in milliseconds (optional) */
  tlsHandshakeTime?: number | null;
  /** TLS protocol version (e.g., "TLS 1.2", "TLS 1.3") (optional) */
  protocolVersion?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TLSPanel component that displays TLS certificate information.
 *
 * Shows certificate details, handshake timing, and protocol version.
 * Displays an empty state for HTTP connections or when certificate data is unavailable.
 *
 * @example
 * ```tsx
 * <TLSPanel certificate={certData} tlsHandshakeTime={34} protocolVersion="TLS 1.3" />
 * ```
 */
export const TLSPanel = ({
  certificate,
  tlsHandshakeTime,
  protocolVersion,
  className,
}: TLSPanelProps): React.ReactElement => {
  const hasCertificate = certificate !== null && certificate !== undefined;

  return (
    <div data-test-id="tls-panel" className={cn('flex flex-col h-full', className)}>
      {hasCertificate ? (
        <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
          {/* Connection Info */}
          {(tlsHandshakeTime !== null && tlsHandshakeTime !== undefined) ||
          (protocolVersion !== null && protocolVersion !== undefined) ? (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-text-secondary mb-2">Connection</h3>
              <div className="bg-bg-raised p-3 rounded border border-border-default space-y-2">
                {tlsHandshakeTime !== null && tlsHandshakeTime !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">TLS Handshake:</span>
                    <span className="text-xs text-text-primary font-mono">
                      {tlsHandshakeTime}ms
                    </span>
                  </div>
                )}
                {protocolVersion !== null && protocolVersion !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Protocol:</span>
                    <span className="text-xs text-text-primary">{protocolVersion}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Certificate Information */}
          <CertificateInfo certificate={certificate} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            variant="muted"
            title="No TLS certificate information available"
            description="This may be an HTTP connection or certificate data was not captured"
          />
        </div>
      )}
    </div>
  );
};
