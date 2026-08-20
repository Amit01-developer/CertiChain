import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});
type Form = z.infer<typeof schema>;

// Google "G" SVG icon (official brand colours)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.09-6.09C34.46 3.19 29.5 1 24 1 14.82 1 7.07 6.64 3.88 14.6l7.1 5.52C12.64 13.82 17.86 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.43c-.54 2.89-2.16 5.33-4.6 6.98l7.1 5.52C43.16 37.18 46.1 31.34 46.1 24.5z"/>
      <path fill="#FBBC05" d="M10.98 28.12A14.54 14.54 0 0 1 9.5 24c0-1.43.24-2.82.68-4.12l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.58 10.76l7.1-5.52-.7-.12z"/>
      <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.49-4.94l-7.1-5.52C28.63 38.42 26.44 39 24 39c-6.14 0-11.36-4.32-13.02-10.12l-7.1 5.52C7.07 42.36 14.82 47 24 47z"/>
    </svg>
  );
}

export default function Login() {
  const { login, loginWithFirebase } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword]     = useState(false);
  const [googleLoading, setGoogleLoading]   = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed.');
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await loginWithFirebase();
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CheckCircle size={32} className="text-brand-mid mx-auto mb-3" />
          <h1 className="font-serif text-3xl text-brand-dark">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to your CertiChain account</p>
        </div>

        <div className="card">
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 border border-brand-border rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-brand-border" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
            <hr className="flex-1 border-brand-border" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" className="input" {...register('email')} />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-brand-mid hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting || googleLoading} className="btn-primary w-full py-3">
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-mid font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
