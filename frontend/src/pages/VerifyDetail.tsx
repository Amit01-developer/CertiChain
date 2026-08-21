import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { VerifyResult } from '../types';
import Spinner from '../components/ui/Spinner';
import { CheckCircle, XCircle, AlertTriangle, Download, Link2, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

export default function VerifyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSrc, setQrSrc] = useState('');
  const [tryId, setTryId] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/verify/${id}`)
      .then(res => { setResult(res.data); })
      .catch(err => { setResult(err.response?.data ?? { success: false, verified: false, status: 'NOT_FOUND', message: 'Not found.' }); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (result?.data?.verificationUrl) {
      QRCode.toDataURL(result.data.verificationUrl, { width: 140, margin: 1 }).then(setQrSrc);
    }
  }, [result]);

  function copyLink() {
    if (result?.data?.verificationUrl) {
      navigator.clipboard.writeText(result.data.verificationUrl);
      toast.success('Link copied!');
    }
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!result || result.status === 'NOT_FOUND') return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="card max-w-md w-full text-center py-12">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-brand-dark mb-2">Certificate Not Found</h1>
        <p className="text-gray-500 mb-6">
          No certificate found with ID <strong>{id}</strong>.<br />
          Please check the ID and try again.
        </p>
        <form onSubmit={e => { e.preventDefault(); if (tryId.trim()) navigate(`/verify/${tryId.trim()}`); }} className="flex gap-2">
          <input value={tryId} onChange={e => setTryId(e.target.value)} placeholder="Try another ID" className="input flex-1" />
          <button type="submit" className="btn-primary">Verify</button>
        </form>
      </div>
    </div>
  );

  const d = result.data!;

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      {result.status === 'ACTIVE' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-5 py-4 mb-8">
          <CheckCircle size={24} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">✓ Certificate Verified</p>
            <p className="text-sm text-green-700">This certificate has been successfully verified.</p>
          </div>
        </div>
      )}
      {result.status === 'REVOKED' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-5 py-4 mb-8">
          <XCircle size={24} className="text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">✕ Certificate Revoked</p>
            <p className="text-sm text-red-700">This certificate is no longer considered valid.</p>
          </div>
        </div>
      )}
      {result.status === 'EXPIRED' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-5 py-4 mb-8">
          <AlertTriangle size={24} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Certificate Expired</p>
            <p className="text-sm text-amber-700">This certificate has passed its expiry date.</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <p className="overline mb-4">Certificate Details</p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {([
            ['Certificate ID',  d.certificateId],
            ['Recipient',       d.recipientName],
            ['Title',           d.title],
            ['Issued By',       d.organization.name],
            ['Org Type',        d.organization.type],
            ['Issue Date',      fmt(d.issueDate)],
            ...(d.expiryDate ? [['Expiry Date', fmt(d.expiryDate)]] : []),
            ...(result.status === 'REVOKED' && d.revocation ? [['Revoked On', fmt(d.revocation.revokedAt)]] : []),
          ] as [string, string][]).map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">{k}</p>
              <p className="font-medium text-brand-dark mt-0.5">{v as string}</p>
            </div>
          ))}
        </div>

        {result.status === 'REVOKED' && d.revocation && (
          <div className="mt-6 bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs font-mono text-red-400 uppercase mb-1">Revocation Reason</p>
            <p className="text-sm text-red-700">{d.revocation.reason}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {qrSrc && (
            <div className="text-center shrink-0">
              <img src={qrSrc} alt="Verification QR" width={140} height={140} />
              <p className="text-xs text-gray-400 mt-1">Scan to verify</p>
            </div>
          )}
          <div className="flex-1 space-y-3">
            <p className="overline">Actions</p>
            {d.pdfUrl && (
              <a href={d.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 w-full justify-center">
                <Download size={15} /> Download Certificate PDF
              </a>
            )}
            <button onClick={copyLink} className="btn-secondary flex items-center gap-2 w-full justify-center">
              <Copy size={15} /> Copy Verification Link
            </button>
            <a href={d.verificationUrl} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 w-full justify-center">
              <Link2 size={15} /> Open Verification Page
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        Verified by CertiChain — certichain.app
      </p>
    </div>
  );
}
