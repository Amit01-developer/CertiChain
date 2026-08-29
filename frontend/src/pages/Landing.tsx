import { Link } from 'react-router-dom';
import {
  Shield, QrCode, Search, Award, CheckCircle, Building2,
  Users, BarChart2, FileText, XCircle, Database,
  ArrowRight, AlertTriangle, ScrollText,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [verifyId, setVerifyId] = useState('');
  const navigate = useNavigate();

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verifyId.trim()) navigate(`/verify/${verifyId.trim()}`);
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="overline mb-3">Digital Certificate Platform</p>
          <h1 className="text-3xl md:text-4xl font-serif text-brand-dark leading-tight mb-5">
            Trusted Credentials.<br />
            <em className="text-brand-mid not-italic">Verified by Organizations.</em><br />
            Secured on Blockchain.
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
            Issue, review and verify digital certificates backed by cryptographic hashing
            and optional Polygon Amoy blockchain anchoring. Built for organizations that
            take credential integrity seriously.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"  className="btn-primary px-6 py-3 text-base">Issue Certificates →</Link>
            <Link to="/verify"    className="btn-secondary px-6 py-3 text-base">Verify a Certificate</Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="bg-white border-2 border-brand-border p-8 shadow-[8px_8px_0_#ded6c5] rotate-1">
            <p className="text-xs font-mono tracking-widest text-gray-400 mb-4">SAMPLE CERTIFICATE</p>
            <h2 className="font-serif text-3xl text-brand-dark mb-2">Amit Chaurasiya</h2>
            <hr className="border-brand-border my-3" />
            <p className="font-serif text-lg text-gray-600">B.Tech — Information Technology</p>
            <p className="text-xs font-mono text-brand-mid mt-3">CC-2026-A8F92D71</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-800">
                <CheckCircle size={10} /> ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Blockchain Verified
              </span>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center">
              <CheckCircle size={16} className="text-brand-light" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────── */}
      <section className="bg-brand-dark text-white py-8">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ['SHA-256',        'Cryptographic hashing'],
            ['QR Verify',      'Instant scan & verify'],
            ['Polygon Amoy',   'Blockchain anchoring'],
            ['Multi-Party',    'Review & approval flow'],
          ].map(([b, s]) => (
            <div key={b} className="border-l border-white/20 pl-5">
              <b className="font-mono text-brand-light block text-base">{b}</b>
              <span className="text-white/60 text-sm">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <p className="overline mb-3 text-center">The Problem</p>
        <h2 className="font-serif text-4xl text-brand-dark text-center mb-14">
          Why traditional certificates fail
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: AlertTriangle, title: 'Fake Certificates',       desc: 'Paper and PDF certificates are trivially forged. No way to verify authenticity without calling the issuer.' },
            { icon: Search,        title: 'Manual Verification',     desc: 'HR teams spend hours making phone calls and sending emails to verify credentials.' },
            { icon: Database,      title: 'Centralized Records',     desc: 'Certificates stored in proprietary systems. If the issuer disappears, records are lost forever.' },
            { icon: XCircle,       title: 'Poor Revocation',         desc: 'Revoked credentials keep circulating. No reliable way to communicate invalidation.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card border-red-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Icon size={18} className="text-red-500" />
              </div>
              <h3 className="font-serif text-lg text-brand-dark mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solution ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-brand-border py-24">
        <div className="max-w-6xl mx-auto px-5">
          <p className="overline mb-3 text-center">The Solution</p>
          <h2 className="font-serif text-4xl text-brand-dark text-center mb-14">
            How CertiChain fixes this
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield,    title: 'Blockchain-Backed Credentials', desc: 'Every certificate is SHA-256 hashed and optionally anchored on Polygon Amoy. The record is tamper-evident and permanent.' },
              { icon: Building2, title: 'Organization-Controlled',      desc: 'Your organization owns the issuance process. Admins and staff work together within a clear permission model.' },
              { icon: Users,     title: 'Multi-Party Verification',     desc: 'Admins can assign staff members to review and approve certificates before they are considered fully verified.' },
              { icon: QrCode,    title: 'Instant Public Verification',  desc: 'Anyone with the certificate ID or QR code can verify authenticity instantly — no account needed.' },
              { icon: XCircle,   title: 'Certificate Revocation',       desc: 'Admins can revoke certificates at any time. The revocation is recorded on-chain where blockchain is enabled.' },
              { icon: Search,    title: 'Audit Trail',                  desc: 'Every action — issuance, review, revocation — is logged with timestamp and actor for full accountability.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand-mid" />
                </div>
                <h3 className="font-serif text-lg text-brand-dark mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <p className="overline mb-3 text-center">How It Works</p>
        <h2 className="font-serif text-4xl text-brand-dark text-center mb-14">
          From organization to blockchain
        </h2>
        <div className="grid sm:grid-cols-5 gap-4 items-start">
          {[
            { step: '01', title: 'Organization',     desc: 'Set up your org and invite staff members with secure email invitations.' },
            { step: '02', title: 'Issue',            desc: 'Admin or staff issue certificates to recipients with PDF generation and QR codes.' },
            { step: '03', title: 'Multi-Party Review', desc: 'Admin assigns staff reviewers. Each reviewer approves or rejects with comments.' },
            { step: '04', title: 'Blockchain Record', desc: 'Certificate hash is anchored on Polygon Amoy (testnet). Transaction hash is recorded.' },
            { step: '05', title: 'QR Verification',  desc: 'Anyone scans the QR or enters the ID to verify status, blockchain record and revocation.' },
          ].map(({ step, title, desc }, i, arr) => (
            <div key={step} className="flex flex-col items-center text-center relative">
              <div className="w-14 h-14 rounded-full bg-brand-dark text-brand-light flex items-center justify-center font-mono text-base mb-4 relative z-10">
                {step}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={20} className="hidden sm:block absolute top-5 -right-3 text-gray-300 z-0" />
              )}
              <h3 className="font-serif text-base mb-2">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Organization Features ─────────────────────────────────────── */}
      <section id="features" className="bg-brand-dark text-white py-24">
        <div className="max-w-6xl mx-auto px-5">
          <p className="overline mb-3 text-center text-white/50">Organization Features</p>
          <h2 className="font-serif text-4xl text-center mb-14">
            Built for real organizations
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield,    title: 'Admin Controls',          desc: 'Owners and admins manage the full certificate lifecycle including revocation.' },
              { icon: Users,     title: 'Staff Collaboration',     desc: 'Staff members can issue certificates and participate in approval workflows via email invitation.' },
              { icon: Award,     title: 'Certificate Management',  desc: 'Full certificate CRUD with templates, recipients, bulk CSV import and PDF generation.' },
              { icon: BarChart2,    title: 'Analytics',              desc: 'Track issuance trends, verification activity and certificate status across your organization.' },
              { icon: ScrollText,  title: 'Audit Logs',             desc: 'Every action is recorded — who did what, when. Full accountability for compliance.' },
              { icon: FileText,  title: 'Custom Templates',        desc: 'Design certificate templates with custom colors, fonts and layouts to match your brand.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-white/10 p-6 hover:border-white/30 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand-light" />
                </div>
                <h3 className="font-serif text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Multi-Party Verification ──────────────────────────────────── */}
      <section className="bg-white border-y border-brand-border py-24">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="overline mb-3">Multi-Party Verification</p>
            <h2 className="font-serif text-4xl text-brand-dark mb-5">
              Multiple trusted reviewers. One trusted record.
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Organizations can assign multiple trusted staff members as reviewers
              for any certificate. Each reviewer independently approves or rejects
              with a recorded comment.
            </p>
            <ul className="space-y-3">
              {[
                'Admin assigns one or more staff reviewers per certificate',
                'Each reviewer sees their pending tasks in the Staff Dashboard',
                'Reviewers submit APPROVED or REJECTED with optional comment',
                'Full approval status shown on the certificate detail page',
                'All decisions are audited with reviewer identity and timestamp',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle size={16} className="text-brand-mid shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-cream border border-brand-border p-6 space-y-3">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-4">Review Status</p>
            {[
              { name: 'Dr. Priya Sharma',  email: 'priya@university.edu', decision: 'APPROVED', note: 'Verified course completion' },
              { name: 'Prof. Raj Kumar',   email: 'raj@university.edu',   decision: 'APPROVED', note: 'Confirmed marks submitted' },
              { name: 'Admin Office',      email: 'admin@university.edu', decision: 'PENDING',  note: '' },
            ].map(r => (
              <div key={r.email} className="bg-white border border-brand-border p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-dark">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                  {r.note && <p className="text-xs text-gray-500 mt-1 italic">{r.note}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 mt-0.5 border ${
                  r.decision === 'APPROVED'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : r.decision === 'REJECTED'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {r.decision}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blockchain ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-brand-dark text-white p-8 font-mono text-xs space-y-3">
            <p className="text-brand-light">// Polygon Amoy Testnet</p>
            <p><span className="text-white/50">network:</span> Polygon Amoy (chainId 80002)</p>
            <p><span className="text-white/50">certHash:</span> <span className="text-green-400 break-all">0x3f4a...d92b</span></p>
            <p><span className="text-white/50">txHash:</span> <span className="text-green-400 break-all">0x7e1c...4fab</span></p>
            <p><span className="text-white/50">status:</span> <span className="text-green-400">CONFIRMED</span></p>
            <p><span className="text-white/50">block:</span> 12,845,001</p>
            <div className="border-t border-white/10 pt-3">
              <p className="text-white/40 text-xs italic">
                Note: This platform uses Polygon Amoy testnet for demonstration purposes.
                Blockchain registration is optional and non-blocking.
              </p>
            </div>
          </div>
          <div>
            <p className="overline mb-3">Blockchain Integration</p>
            <h2 className="font-serif text-4xl text-brand-dark mb-5">
              On-chain certificate anchoring
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              When blockchain is enabled, a SHA-256 hash of each certificate is
              registered on the Polygon Amoy testnet via a smart contract.
              This creates a tamper-evident, permanent record that anyone can verify.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Certificate hash stored on Polygon Amoy testnet',
                'Transaction hash saved for explorer verification',
                'Blockchain status shown on every certificate',
                'Revocation also recorded on-chain',
                'Blockchain is optional — certificates work without it',
              ].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-brand-mid shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Verify CTA ───────────────────────────────────────────────── */}
      <section className="bg-brand-cream py-24">
        <div className="max-w-xl mx-auto px-5 text-center">
          <p className="overline mb-3">Public Verification</p>
          <h2 className="font-serif text-4xl text-brand-dark mb-4">Have a certificate?</h2>
          <p className="text-gray-600 mb-8">
            Enter a Certificate ID to instantly verify its authenticity, status and blockchain record.
          </p>
          <form onSubmit={handleVerify} className="flex gap-3">
            <input
              value={verifyId}
              onChange={e => setVerifyId(e.target.value)}
              placeholder="e.g. CC-2026-A8F92D71"
              className="input flex-1"
              aria-label="Certificate ID"
            />
            <button type="submit" className="btn-primary px-5">Verify</button>
          </form>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-brand-dark text-white py-24 text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-4xl mb-4">Start issuing trusted credentials</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Set up your organization, invite your team, issue certificates with
            multi-party review and blockchain anchoring — all in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-block bg-brand-light text-brand-dark font-semibold px-8 py-3 hover:bg-brand-accent transition-colors">
              Create Free Account →
            </Link>
            <Link to="/verify" className="inline-block border border-white/30 text-white/80 font-semibold px-8 py-3 hover:border-white/60 hover:text-white transition-colors">
              Verify a Certificate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
