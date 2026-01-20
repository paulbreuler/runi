/**
 * @file TLSPanel component tests
 * @description Tests for the TLSPanel component that displays TLS certificate information
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TLSPanel } from './TLSPanel';
import type { CertificateData } from '@/types/certificate';

const mockCertificate: CertificateData = {
  subject: {
    commonName: 'example.com',
    organization: 'Example Inc',
  },
  issuer: {
    commonName: 'DigiCert SHA2 High Assurance Server CA',
    organization: 'DigiCert Inc',
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

describe('TLSPanel', () => {
  it('renders certificate information when certificate is provided', () => {
    render(<TLSPanel certificate={mockCertificate} />);

    expect(screen.getByTestId('certificate-info')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('displays empty state when certificate is null', () => {
    render(<TLSPanel certificate={null} />);

    expect(screen.getByText(/no tls certificate/i)).toBeInTheDocument();
  });

  it('displays empty state when certificate is undefined', () => {
    render(<TLSPanel certificate={undefined} />);

    expect(screen.getByText(/no tls certificate/i)).toBeInTheDocument();
  });

  it('displays TLS handshake timing when provided', () => {
    render(<TLSPanel certificate={mockCertificate} tlsHandshakeTime={34} />);

    expect(screen.getByText(/tls handshake/i)).toBeInTheDocument();
    expect(screen.getByText('34ms')).toBeInTheDocument();
  });

  it('does not display timing when not provided', () => {
    render(<TLSPanel certificate={mockCertificate} />);

    expect(screen.queryByText(/tls handshake/i)).not.toBeInTheDocument();
  });

  it('displays protocol version when provided', () => {
    render(<TLSPanel certificate={mockCertificate} protocolVersion="TLS 1.3" />);

    expect(screen.getByText(/protocol/i)).toBeInTheDocument();
    expect(screen.getByText('TLS 1.3')).toBeInTheDocument();
  });

  it('does not display protocol version when not provided', () => {
    render(<TLSPanel certificate={mockCertificate} />);

    expect(screen.queryByText(/protocol/i)).not.toBeInTheDocument();
  });
});
