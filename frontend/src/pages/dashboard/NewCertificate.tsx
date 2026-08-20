import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, Upload } from 'lucide-react';
import type { Template } from '../../types';

// ── Single certificate schema ──────────────────────────────────────────────
const singleSchema = z.object({
  recipientName:  z.string().min(1, 'Required'),
  recipientEmail: z.string().email('Valid email required'),
  title:          z.string().min(1, 'Required'),
  description:    z.string().optional(),
  achievement:    z.string().optional(),
  customMessage:  z.string().optional(),
  issueDate:      z.string().min(1, 'Required'),
  expiryDate:     z.string().optional(),
  templateId:     z.string().optional(),
  sendEmail:      z.boolean().optional(),
});
type SingleForm = z.infer<typeof singleSchema>;

interface Props { bulk?: boolean; }

export default function NewCertificate({ bulk = false }: Props) {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [issued, setIssued] = useState<{ certificateId: string; id: string } | null>(null);

  // Bulk state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ issued: any[]; errors: string[] } | null>(null);

  useEffect(() => {
    if (orgId) api.get(`/organizations/${orgId}/templates`).then(r => setTemplates(r.data.data ?? [])).catch(() => {});
  }, [orgId]);

  // ── Single form ────────────────────────────────────────────────────────
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: { issueDate: new Date().toISOString().slice(0, 10), sendEmail: true },
  });

  async function onSingleSubmit(data: SingleForm) {
    try {
      const res = await api.post(`/organizations/${orgId}/certificates`, data);
      const cert = res.data.data;
      setIssued({ certificateId: cert.certificateId, id: cert.id });
      toast.success(`Certificate ${cert.certificateId} issued!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue certificate.');
    }
  }

  // ── Bulk form ──────────────────────────────────────────────────────────
  async function onBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) { toast.error('Select a CSV file.'); return; }
    setBulkLoading(true);
    const fd = new FormData();
    fd.append('file', csvFile);
    try {
      const res = await api.post(`/organizations/${orgId}/certificates/bulk`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkResults(res.data.data);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setBulkLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (issued) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <CheckCircle size={56} className="text-brand-mid mx-auto mb-4" />
      <h2 className="font-serif text-2xl text-brand-dark mb-2">Certificate Issued!</h2>
      <p className="font-mono text-brand-mid text-lg mb-6">{issued.certificateId}</p>
      <div className="flex gap-3 justify-center">
        <Link to={`/dashboard/certificates/${issued.id}`} className="btn-primary">View Certificate</Link>
        <button onClick={() => setIssued(null)} className="btn-secondary">Issue Another</button>
      </div>
    </div>
  );

  // ── Bulk mode ──────────────────────────────────────────────────────────
  if (bulk) return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-2">Bulk Issue Certificates</h1>
      <p className="text-gray-500 mb-8">Upload a CSV to issue multiple certificates at once.</p>

      <div className="card mb-6">
        <p className="overline mb-3">CSV Format</p>
        <pre className="bg-brand-cream px-4 py-3 text-xs font-mono overflow-x-auto">
          name,email,certificate_title,issue_date,achievement{'\n'}
          Amit Chaurasiya,amit@example.com,Certificate of Completion,2026-08-19,B.Tech IT{'\n'}
          Rahul Sharma,rahul@example.com,Certificate of Participation,2026-08-19,
        </pre>
        <p className="text-xs text-gray-400 mt-2">Columns: name, email, certificate_title, issue_date (YYYY-MM-DD), achievement (optional)</p>
      </div>

      {bulkResults ? (
        <div className="card space-y-4">
          <p className="text-green-700 font-semibold">✓ {bulkResults.issued.length} certificate(s) issued successfully.</p>
          {bulkResults.errors.length > 0 && (
            <div>
              <p className="text-red-600 font-semibold mb-2">⚠ {bulkResults.errors.length} error(s):</p>
              <ul className="text-sm text-red-700 space-y-1">{bulkResults.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            </div>
          )}
          <Link to="/dashboard/certificates" className="btn-primary inline-block">View Certificates</Link>
        </div>
      ) : (
        <form onSubmit={onBulkSubmit} className="card space-y-4">
          <label className="block border-2 border-dashed border-brand-border p-8 text-center cursor-pointer hover:border-brand-mid transition-colors">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{csvFile ? csvFile.name : 'Click to select CSV file'}</p>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
          </label>
          <button type="submit" disabled={bulkLoading || !csvFile} className="btn-primary w-full py-3">
            {bulkLoading ? 'Processing…' : 'Import CSV'}
          </button>
        </form>
      )}
    </div>
  );

  // ── Single mode ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-2">Issue Certificate</h1>
      <p className="text-gray-500 mb-8">Fill in the recipient details to issue a certificate.</p>

      <form onSubmit={handleSubmit(onSingleSubmit)} className="card space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Recipient Name *</label>
            <input className="input" {...register('recipientName')} />
            {errors.recipientName && <p className="text-red-600 text-xs mt-1">{errors.recipientName.message}</p>}
          </div>
          <div>
            <label className="label">Recipient Email *</label>
            <input type="email" className="input" {...register('recipientEmail')} />
            {errors.recipientEmail && <p className="text-red-600 text-xs mt-1">{errors.recipientEmail.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Certificate Title *</label>
          <input className="input" placeholder="e.g. Certificate of Completion" {...register('title')} />
          {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Achievement / Programme</label>
          <input className="input" placeholder="e.g. B.Tech — Information Technology" {...register('achievement')} />
        </div>

        <div>
          <label className="label">Description (optional)</label>
          <textarea className="input h-20 resize-none" {...register('description')} />
        </div>

        <div>
          <label className="label">Custom Message (optional)</label>
          <textarea className="input h-16 resize-none" {...register('customMessage')} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Issue Date *</label>
            <input type="date" className="input" {...register('issueDate')} />
            {errors.issueDate && <p className="text-red-600 text-xs mt-1">{errors.issueDate.message}</p>}
          </div>
          <div>
            <label className="label">Expiry Date (optional)</label>
            <input type="date" className="input" {...register('expiryDate')} />
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <label className="label">Template (optional)</label>
            <select className="input" {...register('templateId')}>
              <option value="">Default template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('sendEmail')} className="rounded" />
          <span className="text-sm text-gray-600">Send certificate email to recipient</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3">
            {isSubmitting ? 'Issuing…' : 'Issue Certificate'}
          </button>
          <Link to="/dashboard/certificates" className="btn-secondary px-6 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
