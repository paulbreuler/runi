/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CertificateInfo component
 * @description Displays TLS certificate information in a structured format
 */

import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import type { CertificateData } from '@/types/certificate';

export interface CertificateInfoProps {
  /** Certificate data to display */
  certificate: CertificateData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format certificate name fields into a readable string
 */
function formatCertificateName(name: CertificateData['subject']): string {
  const parts: string[] = [];

  if (name.commonName !== undefined && name.commonName !== '') {
    parts.push(`CN=${name.commonName}`);
  }
  if (name.organization !== undefined && name.organization !== '') {
    parts.push(`O=${name.organization}`);
  }
  if (name.organizationalUnit !== undefined && name.organizationalUnit !== '') {
    parts.push(`OU=${name.organizationalUnit}`);
  }
  if (name.locality !== undefined && name.locality !== '') {
    parts.push(`L=${name.locality}`);
  }
  if (name.state !== undefined && name.state !== '') {
    parts.push(`ST=${name.state}`);
  }
  if (name.country !== undefined && name.country !== '') {
    parts.push(`C=${name.country}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Check if certificate is expired or expiring soon
 */
function getCertificateStatus(validTo: string): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration: number | null;
} {
  try {
    const expirationDate = new Date(validTo);
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      isExpired: expirationDate < now,
      isExpiringSoon: daysUntilExpiration > 0 && daysUntilExpiration <= 30,
      daysUntilExpiration: daysUntilExpiration > 0 ? daysUntilExpiration : null,
    };
  } catch {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysUntilExpiration: null,
    };
  }
}

/**
 * CertificateInfo component that displays TLS certificate details.
 *
 * Shows subject, issuer, validity dates, fingerprints, and algorithm information.
 * Displays warnings for expired or soon-to-expire certificates.
 *
 * @example
 * ```tsx
 * <CertificateInfo certificate={certData} />
 * ```
 */
export const CertificateInfo = ({
  certificate,
  className,
}: CertificateInfoProps): React.ReactElement => {
  const status = useMemo(() => getCertificateStatus(certificate.validTo), [certificate.validTo]);

  const subjectDisplay = useMemo(
    () => formatCertificateName(certificate.subject),
    [certificate.subject]
  );

  const issuerDisplay = useMemo(
    () => formatCertificateName(certificate.issuer),
    [certificate.issuer]
  );

  return (
    <div data-testid="certificate-info" className={cn('space-y-4 text-sm', className)}>
      {/* Status warning */}
      {status.isExpired && (
        <div
          className="px-3 py-2 rounded bg-signal-warning/10 border border-signal-warning/20 text-signal-warning"
          role="alert"
        >
          <strong>Certificate Expired</strong>
          <p className="text-xs mt-1">
            This certificate expired on {formatDate(certificate.validTo)}
          </p>
        </div>
      )}

      {status.isExpiringSoon && !status.isExpired && (
        <div
          className="px-3 py-2 rounded bg-signal-warning/10 border border-signal-warning/20 text-signal-warning"
          role="alert"
        >
          <strong>Certificate Expiring Soon</strong>
          <p className="text-xs mt-1">
            This certificate will expire in {status.daysUntilExpiration} day
            {status.daysUntilExpiration !== 1 ? 's' : ''} on {formatDate(certificate.validTo)}
          </p>
        </div>
      )}

      {/* Subject */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary mb-1.5">Subject</h3>
        <div className="bg-bg-raised p-3 rounded border border-border-default">
          <div className="font-mono text-xs text-text-primary break-all">{subjectDisplay}</div>
          {certificate.subject.commonName !== undefined &&
            certificate.subject.commonName !== '' && (
              <div className="mt-2 text-xs text-text-muted">
                Common Name:{' '}
                <span className="text-text-primary">{certificate.subject.commonName}</span>
              </div>
            )}
        </div>
      </div>

      {/* Issuer */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary mb-1.5">Issuer</h3>
        <div className="bg-bg-raised p-3 rounded border border-border-default">
          <div className="font-mono text-xs text-text-primary break-all">{issuerDisplay}</div>
          {certificate.issuer.commonName !== undefined && certificate.issuer.commonName !== '' && (
            <div className="mt-2 text-xs text-text-muted">
              Common Name:{' '}
              <span className="text-text-primary">{certificate.issuer.commonName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Validity */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary mb-1.5">Validity</h3>
        <div className="bg-bg-raised p-3 rounded border border-border-default space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Valid From:</span>
            <span className="text-xs text-text-primary font-mono">
              {formatDate(certificate.validFrom)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Valid To:</span>
            <span className="text-xs text-text-primary font-mono">
              {formatDate(certificate.validTo)}
            </span>
          </div>
        </div>
      </div>

      {/* Certificate Details */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary mb-1.5">Certificate Details</h3>
        <div className="bg-bg-raised p-3 rounded border border-border-default space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Serial Number:</span>
            <span className="text-xs text-text-primary font-mono break-all">
              {certificate.serialNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Version:</span>
            <span className="text-xs text-text-primary">{certificate.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Signature Algorithm:</span>
            <span className="text-xs text-text-primary">{certificate.signatureAlgorithm}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Public Key Algorithm:</span>
            <span className="text-xs text-text-primary">{certificate.publicKeyAlgorithm}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Key Size:</span>
            <span className="text-xs text-text-primary">{certificate.keySize} bits</span>
          </div>
        </div>
      </div>

      {/* Fingerprints */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary mb-1.5">Fingerprints</h3>
        <div className="bg-bg-raised p-3 rounded border border-border-default space-y-2">
          {certificate.fingerprint.sha256 !== undefined &&
            certificate.fingerprint.sha256 !== '' && (
              <div>
                <div className="text-xs text-text-muted mb-1">SHA-256:</div>
                <div className="text-xs text-text-primary font-mono break-all">
                  {certificate.fingerprint.sha256}
                </div>
              </div>
            )}
          {certificate.fingerprint.sha1 !== undefined && certificate.fingerprint.sha1 !== '' && (
            <div>
              <div className="text-xs text-text-muted mb-1">SHA-1:</div>
              <div className="text-xs text-text-primary font-mono break-all">
                {certificate.fingerprint.sha1}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
