import type { CertificateStatus } from '../../types';

const map: Record<CertificateStatus, string> = {
  DRAFT:    'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-blue-50   text-blue-700  border border-blue-200',
  ACTIVE:   'badge-active',
  REVOKED:  'badge-revoked',
  EXPIRED:  'badge-expired',
  REJECTED: 'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-red-50    text-red-700   border border-red-200',
};

const label: Record<CertificateStatus, string> = {
  DRAFT:    'Draft',
  ACTIVE:   'Active',
  REVOKED:  'Revoked',
  EXPIRED:  'Expired',
  REJECTED: 'Rejected',
};

export default function Badge({ status }: { status: CertificateStatus }) {
  return <span className={map[status] ?? 'badge-expired'}>{label[status] ?? status}</span>;
}
