import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Template } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

export default function Templates() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/organizations/${orgId}/templates`).then(r => setTemplates(r.data.data ?? [])).finally(() => setLoading(false));
  }, [orgId]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    await api.delete(`/organizations/${orgId}/templates/${id}`);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted.');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-brand-dark">Templates</h1>
        <Link to="/dashboard/templates/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Template
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No templates yet"
          message="Create a template to customise how your certificates look."
          action={{ label: 'Create Template', to: '/dashboard/templates/new' }}
        />
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="pb-3 font-semibold text-xs text-gray-500">Name</th>
                <th className="pb-3 font-semibold text-xs text-gray-500">Layout</th>
                <th className="pb-3 font-semibold text-xs text-gray-500">Created</th>
                <th className="pb-3 font-semibold text-xs text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                  <td className="py-3 font-medium text-brand-dark">{t.name}</td>
                  <td className="py-3 text-gray-500 capitalize">{(t.configuration as any)?.layout ?? 'landscape'}</td>
                  <td className="py-3 text-gray-500 text-xs">{fmt(t.createdAt)}</td>
                  <td className="py-3">
                    <button onClick={() => handleDelete(t.id, t.name)} className="text-gray-400 hover:text-red-500" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
