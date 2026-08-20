export interface User {
  id:            string;
  name:          string;
  email:         string;
  emailVerified: boolean;
  role:          'USER' | 'SUPER_ADMIN';
  createdAt:     string;
}

export interface Organization {
  id:          string;
  name:        string;
  type:        string;
  logoUrl?:    string | null;
  website?:    string | null;
  description?: string | null;
  email:       string;
  phone?:      string | null;
  address?:    string | null;
  suspended:   boolean;
  createdAt:   string;
  role?:       OrgMemberRole;
}

export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'STAFF';
export type CertificateStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface Certificate {
  id:              string;
  certificateId:   string;
  organizationId:  string;
  title:           string;
  description?:    string | null;
  achievement?:    string | null;
  customMessage?:  string | null;
  issueDate:       string;
  expiryDate?:     string | null;
  status:          CertificateStatus;
  pdfUrl?:         string | null;
  qrCodeUrl?:      string | null;
  verificationUrl: string;
  createdAt:       string;
  recipient:       Recipient;
  template?:       { id: string; name: string } | null;
}

export interface Recipient {
  id:    string;
  name:  string;
  email: string;
}

export interface Template {
  id:            string;
  name:          string;
  configuration: TemplateConfig;
  previewUrl?:   string | null;
  createdAt:     string;
}

export interface TemplateConfig {
  layout?:       'landscape' | 'portrait';
  primaryColor?: string;
  accentColor?:  string;
  fontFamily?:   string;
  showLogo?:     boolean;
  showQR?:       boolean;
  showSignature?: boolean;
}

export interface VerifyResult {
  success:  boolean;
  verified: boolean;
  status:   'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  message:  string;
  data?: {
    certificateId:   string;
    title:           string;
    recipientName:   string;
    organization:    { id: string; name: string; logoUrl?: string | null; website?: string | null; type: string };
    issueDate:       string;
    expiryDate?:     string | null;
    status:          CertificateStatus;
    verificationUrl: string;
    pdfUrl?:         string | null;
    qrCodeUrl?:      string | null;
    revocation?: { reason: string; revokedAt: string };
  };
}

export interface PaginatedResponse<T> {
  data:  { items: T[]; total: number; page: number; pages: number };
  success: boolean;
}
