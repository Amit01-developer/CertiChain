import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Award, Download, Eye, Plus, Upload, Search } from 'lucide-react';
import type { Certificate, CertificateStatus } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

export default function Certificates() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CertificateStatus | ''>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    if (query)  params.set('search', query);
    api.get(`/organizations/${orgId}/certificates?${params}`)
      .then(r => {
        setCerts(r.data.data.certificates ?? []);
        setTotal(r.data.data.total ?? 0);
        setPages(r.data.data.pages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [orgId, page, status, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-dark">Certificates</h1>
        <div className="flex gap-2">
          <Link to="/dashboard/certificates/bulk" className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={14} /> Bulk Import
          </Link>
          <Link to="/dashboard/certificates/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Issue Certificate
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or title…" className="input pl-8" />
          </div>
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select value={status} onChange={e => { setStatus(e.target.value as any); setPage(1); }} className="input w-40">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="REVOKED">Revoked</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : certs.length === 0 ? (
        <EmptyState
          icon={<Award size={48} />}
          title="No certificates found"
          message="Issue your first certificate to get started."
          action={{ label: 'Issue Certificate', to: '/dashboard/certificates/new' }}
        />
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{total} certificate{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  {['Certificate ID', 'Recipient', 'Title', 'Status', 'Issue Date', 'Actions'].map(h => (
                    <th key={h} className="pb-3 font-semibold text-xs text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certs.map(c => (
                  <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-3 font-mono text-xs text-brand-mid">{c.certificateId}</td>
                    <td className="py-3 text-gray-700">{c.recipient?.name}</td>
                    <td className="py-3 text-gray-600 max-w-[180px] truncate">{c.title}</td>
                    <td className="py-3"><Badge status={c.status} /></td>
                    <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(c.issueDate)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link to={`/dashboard/certificates/${c.id}`} className="text-gray-400 hover:text-brand-mid" title="View">
                          <Eye size={15} />
                        </Link>
                        {c.pdfUrl && (
                          <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-mid" title="Download">
                            <Download size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
