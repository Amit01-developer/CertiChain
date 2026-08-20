import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 text-center">
      <div>
        <p className="font-mono text-6xl font-bold text-brand-light mb-4">404</p>
        <h1 className="font-serif text-3xl text-brand-dark mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary px-8 py-3">Back to Home</Link>
      </div>
    </div>
  );
}
