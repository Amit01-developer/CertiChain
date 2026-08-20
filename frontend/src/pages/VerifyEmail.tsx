import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="card max-w-md w-full text-center py-12">
        {status === 'loading' && <Spinner size="lg" className="mx-auto" />}
        {status === 'ok' && (
          <>
            <CheckCircle size={48} className="text-brand-mid mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-brand-dark mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">Your account is now active. You can sign in.</p>
            <Link to="/login" className="btn-primary px-8 py-3">Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-brand-dark mb-2">Invalid Link</h1>
            <p className="text-gray-500 mb-6">This verification link is invalid or has expired.</p>
            <Link to="/login" className="btn-secondary px-8 py-3">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
