/**
 * @file CertificateInfo component tests
 * @description Tests for the CertificateInfo component that displays TLS certificate details
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CertificateInfo } from './CertificateInfo';
import type { CertificateData } from '@/types/certificate';

const mockCertificate: CertificateData = {
  subject: {
    commonName: 'example.com',
    organization: 'Example Inc',
    organizationalUnit: 'IT Department',
    country: 'US',
    state: 'California',
    locality: 'San Francisco',
  },
  issuer: {
    commonName: 'DigiCert SHA2 High Assurance Server CA',
    organization: 'DigiCert Inc',
    country: 'US',
  },
  validFrom: '2024-01-01T00:00:00Z',
  validTo: '2025-12-31T23:59:59Z',
  serialNumber: '1234567890ABCDEF',
  fingerprint: {
    sha256: 'A1:B2:C3:D4:E5:F6:...',
    sha1: '12:34:56:78:90:AB:...',
  },
  version: 3,
  signatureAlgorithm: 'SHA256withRSA',
  publicKeyAlgorithm: 'RSA',
  keySize: 2048,
};

describe('CertificateInfo', () => {
  it('renders certificate subject information', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText(/Example Inc/)).toBeInTheDocument();
  });

  it('renders certificate issuer information', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText('Issuer')).toBeInTheDocument();
    expect(screen.getByText('DigiCert SHA2 High Assurance Server CA')).toBeInTheDocument();
    expect(screen.getByText(/DigiCert Inc/)).toBeInTheDocument();
  });

  it('renders validity dates', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText(/Valid From/)).toBeInTheDocument();
    expect(screen.getByText(/Valid To/)).toBeInTheDocument();
  });

  it('renders certificate details', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText(/Serial Number/)).toBeInTheDocument();
    expect(screen.getByText('1234567890ABCDEF')).toBeInTheDocument();
    expect(screen.getByText(/Version/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders fingerprint information', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText(/SHA-256/)).toBeInTheDocument();
    expect(screen.getByText('A1:B2:C3:D4:E5:F6:...')).toBeInTheDocument();
    expect(screen.getByText(/SHA-1/)).toBeInTheDocument();
    expect(screen.getByText('12:34:56:78:90:AB:...')).toBeInTheDocument();
  });

  it('renders algorithm information', () => {
    render(<CertificateInfo certificate={mockCertificate} />);

    expect(screen.getByText(/Signature Algorithm/)).toBeInTheDocument();
    expect(screen.getByText('SHA256withRSA')).toBeInTheDocument();
    expect(screen.getByText(/Public Key Algorithm/)).toBeInTheDocument();
    expect(screen.getByText('RSA')).toBeInTheDocument();
    expect(screen.getByText(/Key Size/)).toBeInTheDocument();
    expect(screen.getByText(/2048/)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalCertificate: CertificateData = {
      subject: {
        commonName: 'example.com',
      },
      issuer: {
        commonName: 'CA',
      },
      validFrom: '2024-01-01T00:00:00Z',
      validTo: '2025-12-31T23:59:59Z',
      serialNumber: '123',
      fingerprint: {
        sha256: 'A1:B2:C3',
      },
      version: 3,
      signatureAlgorithm: 'SHA256withRSA',
      publicKeyAlgorithm: 'RSA',
      keySize: 2048,
    };

    render(<CertificateInfo certificate={minimalCertificate} />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('displays expiration warning for expired certificates', () => {
    const expiredCertificate: CertificateData = {
      ...mockCertificate,
      validTo: '2020-01-01T00:00:00Z',
    };

    render(<CertificateInfo certificate={expiredCertificate} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Certificate Expired/i);
  });

  it('displays expiration warning for soon-to-expire certificates', () => {
    const soonToExpire = new Date();
    soonToExpire.setDate(soonToExpire.getDate() + 7); // 7 days from now

    const soonExpiringCertificate: CertificateData = {
      ...mockCertificate,
      validTo: soonToExpire.toISOString(),
    };

    render(<CertificateInfo certificate={soonExpiringCertificate} />);

    expect(screen.getByText(/expiring soon/i)).toBeInTheDocument();
  });
});
