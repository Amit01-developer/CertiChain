import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Users, Search } from 'lucide-react';

interface Recipient { id: string; name: string; email: string; _count: { certificates: number }; }

export default function Recipients() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('search', query);
    api.get(`/organizations/${orgId}/recipients?${params}`)
      .then(r => { setRecipients(r.data.data.recipients ?? []); setTotal(r.data.data.total ?? 0); setPages(r.data.data.pages ?? 1); })
      .finally(() => setLoading(false));
  }, [orgId, page, query]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setQuery(search); setPage(1); }

  return (
    <div>
      <h1 className="font-serif text-3xl text-brand-dark mb-6">Recipients</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="input pl-8" />
        </div>
        <button type="submit" className="btn-primary px-4">Search</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : recipients.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No recipients yet" message="Recipients are created automatically when you issue certificates." />
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">{total} recipient{total !== 1 ? 's' : ''}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                {['Name', 'Email', 'Certificates'].map(h => (
                  <th key={h} className="pb-3 font-semibold text-xs text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipients.map(r => (
                <tr key={r.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                  <td className="py-3 font-medium text-brand-dark">{r.name}</td>
                  <td className="py-3 text-gray-500">{r.email}</td>
                  <td className="py-3 text-gray-600">{r._count.certificates}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
