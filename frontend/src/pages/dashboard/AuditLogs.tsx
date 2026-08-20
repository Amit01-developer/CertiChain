import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { ScrollText } from 'lucide-react';

interface Log { id: string; action: string; resourceType?: string; resourceId?: string; ipAddress?: string; createdAt: string; user?: { name: string; email: string } | null; }

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export default function AuditLogs() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    api.get(`/organizations/${orgId}/audit-logs?page=${page}`)
      .then(r => { setLogs(r.data.data.logs ?? []); setTotal(r.data.data.total ?? 0); setPages(r.data.data.pages ?? 1); })
      .finally(() => setLoading(false));
  }, [orgId, page]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-brand-dark mb-6">Audit Logs</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ScrollText size={40} className="mx-auto mb-3" />
          <p>No audit events yet.</p>
        </div>
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">{total} event{total !== 1 ? 's' : ''}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  {['Timestamp', 'User', 'Action', 'Resource', 'IP'].map(h => (
                    <th key={h} className="pb-3 font-semibold text-xs text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmt(l.createdAt)}</td>
                    <td className="py-2.5 text-gray-700">{l.user?.name ?? <span className="text-gray-400">System</span>}</td>
                    <td className="py-2.5 font-mono text-xs text-brand-mid">{l.action}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{l.resourceType ? `${l.resourceType}${l.resourceId ? ` #${l.resourceId.slice(0, 8)}` : ''}` : '—'}</td>
                    <td className="py-2.5 text-gray-400 text-xs font-mono">{l.ipAddress ?? '—'}</td>
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
