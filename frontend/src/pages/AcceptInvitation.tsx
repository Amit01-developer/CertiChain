import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { CheckCircle, Building2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface InvitePreview {
  email:        string;
  role:         string;
  organization: { id: string; name: string; type: string; logoUrl: string | null };
  expiresAt:    string;
  userExists:   boolean;
}

const newUserSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters.'),
  password:        z.string().min(8, 'Password must be at least 8 characters.')
                     .regex(/[A-Z]/, 'Must contain an uppercase letter.')
                     .regex(/[0-9]/, 'Must contain a number.'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type NewUserForm = z.infer<typeof newUserSchema>;

export default function AcceptInvitation() {
  const [params]         = useSearchParams();
  const navigate         = useNavigate();
  const { loginWithToken } = useAuth();
  const token            = params.get('token') ?? '';

  const [preview,  setPreview]  = useState<InvitePreview | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [accepting, setAccepting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
  });

  useEffect(() => {
    if (!token) { setError('No invitation token found in the link.'); setLoading(false); return; }

    api.get(`/invitations/preview?token=${encodeURIComponent(token)}`)
      .then(r => setPreview(r.data.data))
      .catch(e => setError(e.response?.data?.message ?? 'Invalid or expired invitation.'))
      .finally(() => setLoading(false));
  }, [token]);

  /** Existing user — accept immediately without a form. */
  async function acceptExisting() {
    setAccepting(true);
    try {
      const res = await api.post('/invitations/accept', { token });
      const { token: jwt } = res.data.data;
      await loginWithToken(jwt);
      toast.success(res.data.message ?? 'Welcome!');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to accept invitation.');
    } finally { setAccepting(false); }
  }

  /** New user — submit registration form + token. */
  async function acceptNew(data: NewUserForm) {
    setAccepting(true);
    try {
      const res = await api.post('/invitations/accept', { token, name: data.name, password: data.password });
      const { token: jwt } = res.data.data;
      await loginWithToken(jwt);
      toast.success(res.data.message ?? 'Welcome!');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to accept invitation.');
    } finally { setAccepting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-brand-dark mb-2">Invitation Invalid</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/login" className="btn-primary">Go to Login</Link>
      </div>
    </div>
  );

  if (!preview) return null;

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Org header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-border">
          <div className="w-14 h-14 bg-brand-cream rounded-full flex items-center justify-center border border-brand-border overflow-hidden shrink-0">
            {preview.organization.logoUrl
              ? <img src={preview.organization.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              : <Building2 size={24} className="text-gray-400" />}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wide mb-0.5">You've been invited to</p>
            <h2 className="font-serif text-xl text-brand-dark leading-tight">{preview.organization.name}</h2>
            <p className="text-xs text-gray-500">{preview.organization.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <CheckCircle size={16} className="text-brand-mid shrink-0" />
          <p className="text-sm text-gray-700">
            As <strong>{preview.role}</strong> · Invited to <strong>{preview.email}</strong>
          </p>
        </div>

        {preview.userExists ? (
          /* ── Existing user: one-click accept ─────────────────────── */
          <div className="space-y-4">
            <div className="bg-brand-cream border border-brand-border px-4 py-3 text-sm text-gray-600">
              We found an existing CertiChain account for <strong>{preview.email}</strong>.
              Click below to accept and be added as Staff.
            </div>
            <button
              onClick={acceptExisting}
              disabled={accepting}
              className="btn-primary w-full py-3"
            >
              {accepting ? 'Accepting…' : `Accept & Join ${preview.organization.name}`}
            </button>
            <p className="text-center text-xs text-gray-400">
              Not your account? <Link to="/login" className="underline">Sign in with a different account</Link>
            </p>
          </div>
        ) : (
          /* ── New user: registration form ─────────────────────────── */
          <form onSubmit={handleSubmit(acceptNew)} className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Create your CertiChain account to accept this invitation.</p>

            <div>
              <label className="label">Your Name *</label>
              <input className="input" placeholder="Full name" {...register('name')} />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input bg-gray-50" value={preview.email} disabled />
            </div>

            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min. 8 chars, 1 uppercase, 1 number" {...register('password')} />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <input type="password" className="input" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={accepting} className="btn-primary w-full py-3">
              {accepting ? 'Creating account…' : `Create Account & Join ${preview.organization.name}`}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Invitation expires {new Date(preview.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
