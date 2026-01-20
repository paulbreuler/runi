/**
 * TLS certificate data types
 */

/**
 * Certificate subject or issuer information
 */
export interface CertificateName {
  /** Common Name (CN) */
  commonName?: string;
  /** Organization (O) */
  organization?: string;
  /** Organizational Unit (OU) */
  organizationalUnit?: string;
  /** Country (C) */
  country?: string;
  /** State or Province (ST) */
  state?: string;
  /** Locality (L) */
  locality?: string;
}

/**
 * Certificate fingerprint information
 */
export interface CertificateFingerprint {
  /** SHA-256 fingerprint */
  sha256?: string;
  /** SHA-1 fingerprint */
  sha1?: string;
}

/**
 * TLS certificate data
 */
export interface CertificateData {
  /** Certificate subject (owner) */
  subject: CertificateName;
  /** Certificate issuer (CA) */
  issuer: CertificateName;
  /** Certificate validity start date (ISO 8601) */
  validFrom: string;
  /** Certificate validity end date (ISO 8601) */
  validTo: string;
  /** Certificate serial number */
  serialNumber: string;
  /** Certificate fingerprints */
  fingerprint: CertificateFingerprint;
  /** Certificate version (typically 3) */
  version: number;
  /** Signature algorithm (e.g., "SHA256withRSA") */
  signatureAlgorithm: string;
  /** Public key algorithm (e.g., "RSA", "ECDSA") */
  publicKeyAlgorithm: string;
  /** Key size in bits */
  keySize: number;
}
