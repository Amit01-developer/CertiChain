import { Link } from 'react-router-dom';
import { Shield, QrCode, Search, Award, CheckCircle, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: Award,     title: 'Instant Certificate Issuing', desc: 'Issue professional digital certificates in seconds with custom templates.' },
  { icon: QrCode,    title: 'QR Verification',             desc: 'Every certificate gets a unique QR code linking to the public verification page.' },
  { icon: Shield,    title: 'Tamper-Resistant Records',    desc: 'SHA-256 cryptographic hashing ensures certificates cannot be modified.' },
  { icon: Search,    title: 'Public Verification',         desc: 'Anyone can verify a certificate instantly — no account required.' },
  { icon: CheckCircle, title: 'Certificate Management',   desc: 'Track, revoke and audit certificates from your organization dashboard.' },
  { icon: Building2, title: 'Multi-Role Organizations',   desc: 'Owner, Admin, and Staff roles keep control where it belongs.' },
];

export default function Landing() {
  const [verifyId, setVerifyId] = useState('');
  const navigate = useNavigate();

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verifyId.trim()) navigate(`/verify/${verifyId.trim()}`);
  }

  return (
    <div>
      <section className="max-w-6xl mx-auto px-5 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="overline mb-3">Digital Certificate Platform</p>
          <h1 className="text-5xl md:text-6xl font-serif text-brand-dark leading-tight mb-5">
            Issue. Verify.<br /><em className="text-brand-mid not-italic">Trust.</em>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
            A secure platform for issuing, sharing and verifying digital certificates.
            Tamper-proof records. Instant QR verification. Zero blockchain required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">Get Started →</Link>
            <Link to="/verify"   className="btn-secondary px-6 py-3 text-base">Verify Certificate</Link>
          </div>
        </div>

        <div className="relative">
          <div className="bg-white border-2 border-brand-border p-8 shadow-[8px_8px_0_#ded6c5] rotate-1">
            <p className="text-xs font-mono tracking-widest text-gray-400 mb-4">SAMPLE CERTIFICATE</p>
            <h2 className="font-serif text-3xl text-brand-dark mb-2">Amit Chaurasiya</h2>
            <hr className="border-brand-border my-3" />
            <p className="font-serif text-lg text-gray-600">B.Tech — Information Technology</p>
            <p className="text-xs font-mono text-brand-mid mt-3">CC-2026-A8F92D71</p>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center">
              <CheckCircle size={16} className="text-brand-light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-dark text-white py-8">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-3 gap-6">
          {[['SHA-256', 'Cryptographic hashing'], ['QR', 'Instant scan & verify'], ['REST API', 'Full backend integration']].map(([b, s]) => (
            <div key={b} className="border-l border-white/20 pl-5">
              <b className="font-mono text-brand-light block text-lg">{b}</b>
              <span className="text-white/60 text-sm">{s}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 py-24">
        <p className="overline mb-3 text-center">Features</p>
        <h2 className="font-serif text-4xl text-brand-dark text-center mb-14">Everything you need</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center mb-4">
                <Icon size={18} className="text-brand-mid" />
              </div>
              <h3 className="font-serif text-lg text-brand-dark mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-brand-border py-24">
        <div className="max-w-6xl mx-auto px-5">
          <p className="overline mb-3 text-center">How It Works</p>
          <h2 className="font-serif text-4xl text-brand-dark text-center mb-14">Four simple steps</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {['Create', 'Issue', 'Share', 'Verify'].map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-dark text-brand-light flex items-center justify-center font-mono text-lg mx-auto mb-4">
                  0{i + 1}
                </div>
                <h3 className="font-serif text-xl mb-2">{step}</h3>
                <p className="text-sm text-gray-500">
                  {['Set up your organization and certificate templates.', 'Fill in recipient details and issue with one click.', 'Recipient receives a PDF with QR code and verification link.', 'Anyone scans the QR or enters the ID to instantly verify.'][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-cream py-24">
        <div className="max-w-xl mx-auto px-5 text-center">
          <p className="overline mb-3">Public Verification</p>
          <h2 className="font-serif text-4xl text-brand-dark mb-4">Have a certificate?</h2>
          <p className="text-gray-600 mb-8">Enter a Certificate ID to instantly verify its authenticity.</p>
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

      <section className="bg-brand-dark text-white py-24 text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-4xl mb-4">Ready to get started?</h2>
          <p className="text-white/60 mb-8">Create your organization and issue your first certificate in minutes.</p>
          <Link to="/register" className="inline-block bg-brand-light text-brand-dark font-semibold px-8 py-3 hover:bg-brand-accent transition-colors">
            Create Free Account →
          </Link>
        </div>
      </section>
    </div>
  );
}
