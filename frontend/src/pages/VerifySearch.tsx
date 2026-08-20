import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield } from 'lucide-react';

export default function VerifySearch() {
  const [id, setId] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (id.trim()) navigate(`/verify/${id.trim()}`);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-full bg-brand-dark flex items-center justify-center mx-auto mb-6">
          <Shield size={28} className="text-brand-light" />
        </div>
        <p className="overline mb-3">Public Verification</p>
        <h1 className="font-serif text-4xl text-brand-dark mb-4">Verify a Certificate</h1>
        <p className="text-gray-500 mb-8">
          Enter a Certificate ID to instantly verify its authenticity.
          No account required.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="e.g. CC-2026-A8F92D71"
              className="input pl-9"
              aria-label="Certificate ID"
            />
          </div>
          <button type="submit" className="btn-primary px-6">Verify</button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Certificate IDs are printed on the certificate and embedded in the QR code.
        </p>
      </div>
    </div>
  );
}
