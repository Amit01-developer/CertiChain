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
export type CertificateStatus = 'DRAFT' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'REJECTED';

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
  layout?:          'landscape' | 'portrait';
  primaryColor?:    string;
  accentColor?:     string;
  fontFamily?:      string;
  showLogo?:        boolean;
  showQR?:          boolean;
  showSignature?:   boolean;
  customImageUrl?:  string | null;
}

export type BlockchainStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type BlockchainVerificationStatus =
  | 'VERIFIED'
  | 'HASH_MISMATCH'
  | 'NOT_FOUND'
  | 'REVOKED'
  | 'DISABLED'
  | 'ERROR';

export interface BlockchainVerification {
  enabled:       boolean;
  onChain:       boolean;
  hashMatch:     boolean;
  revoked:       boolean;
  txHash:        string | null;
  txUrl:         string | null;
  network:       string | null;
  registeredAt:  number | null;  // unix timestamp
  status:        BlockchainVerificationStatus;
  error?:        string;
}

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
  blockchainStatus?:   BlockchainStatus | null;
  blockchainTxHash?:   string | null;
  blockchainHash?:     string | null;
  blockchainNetwork?:  string | null;
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
    revocation?:     { reason: string; revokedAt: string };
    blockchain?:     BlockchainVerification;
  };
}

export interface PaginatedResponse<T> {
  data:  { items: T[]; total: number; page: number; pages: number };
  success: boolean;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';
export type ReviewDecision   = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OrgMember {
  id:        string;
  userId:    string;
  role:      OrgMemberRole;
  createdAt: string;
  user: {
    id:        string;
    name:      string;
    email:     string;
    avatarUrl: string | null;
    createdAt: string;
  };
}

export interface PendingInvite {
  id:        string;
  email:     string;
  role:      OrgMemberRole;
  expiresAt: string;
  createdAt: string;
}

export interface CertificateReview {
  id:            string;
  certificateId: string;
  reviewerId:    string;
  reviewerRole:  OrgMemberRole;
  decision:      ReviewDecision;
  comment:       string | null;
  decidedAt:     string | null;
  createdAt:     string;
  reviewer?: {
    id:        string;
    name:      string;
    email:     string;
    avatarUrl: string | null;
  };
  certificate?: Certificate & {
    recipient: { name: string; email: string };
    organization: { id: string; name: string };
    reviews?: CertificateReview[];
  };
}

export interface ReviewSummary {
  total:    number;
  pending:  number;
  approved: number;
  rejected: number;
}

