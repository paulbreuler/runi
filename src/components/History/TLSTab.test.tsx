/**
 * @file TLSTab component tests
 * @description Tests for the TLSTab component - TLS tab for expanded panel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TLSTab } from './TLSTab';
import type { NetworkHistoryEntry } from '@/types/history';
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

const mockEntry: NetworkHistoryEntry = {
  id: 'test-1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"name":"John"}',
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: { 'Content-Type': 'application/json' },
    body: '{"id":1}',
    timing: {
      total_ms: 156,
      dns_ms: 12,
      connect_ms: 23,
      tls_ms: 34,
      first_byte_ms: 98,
    },
  },
};

describe('TLSTab', () => {
  it('renders TLSPanel with entry data', () => {
    render(<TLSTab entry={mockEntry} certificate={mockCertificate} />);

    expect(screen.getByTestId('tls-panel')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('displays TLS handshake time from entry timing', () => {
    render(<TLSTab entry={mockEntry} certificate={mockCertificate} />);

    expect(screen.getByText(/tls handshake/i)).toBeInTheDocument();
    expect(screen.getByText('34ms')).toBeInTheDocument();
  });

  it('handles entry with null TLS timing', () => {
    const entryWithoutTls: NetworkHistoryEntry = {
      ...mockEntry,
      response: {
        ...mockEntry.response,
        timing: {
          ...mockEntry.response.timing,
          tls_ms: null,
        },
      },
    };

    render(<TLSTab entry={entryWithoutTls} certificate={mockCertificate} />);

    expect(screen.getByTestId('tls-panel')).toBeInTheDocument();
    expect(screen.queryByText(/tls handshake/i)).not.toBeInTheDocument();
  });

  it('handles null certificate', () => {
    render(<TLSTab entry={mockEntry} certificate={null} />);

    expect(screen.getByText(/no tls certificate/i)).toBeInTheDocument();
  });

  it('handles undefined certificate', () => {
    render(<TLSTab entry={mockEntry} certificate={undefined} />);

    expect(screen.getByText(/no tls certificate/i)).toBeInTheDocument();
  });

  it('displays protocol version when provided', () => {
    render(<TLSTab entry={mockEntry} certificate={mockCertificate} protocolVersion="TLS 1.3" />);

    expect(screen.getByText(/protocol/i)).toBeInTheDocument();
    expect(screen.getByText('TLS 1.3')).toBeInTheDocument();
  });
});
