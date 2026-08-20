import type { CertificateStatus } from '../../types';

export default function Badge({ status }: { status: CertificateStatus }) {
  const map: Record<CertificateStatus, string> = {
    ACTIVE:  'badge-active',
    REVOKED: 'badge-revoked',
    EXPIRED: 'badge-expired',
  };
  return <span className={map[status]}>{status}</span>;
}
