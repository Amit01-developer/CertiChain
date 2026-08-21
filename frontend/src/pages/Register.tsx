import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name:             z.string().min(2, 'Name required'),
  email:            z.string().email('Valid email required'),
  password:         z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Include uppercase').regex(/[0-9]/, 'Include a number'),
  confirmPassword:  z.string(),
  organizationName: z.string().min(2, 'Organization name required'),
  organizationType: z.string().min(1, 'Select a type'),
  website:          z.string().url('Valid URL').optional().or(z.literal('')),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

const orgTypes = ['University', 'School', 'College', 'Company', 'NGO', 'Training Institute', 'Event Organizer', 'Other'];

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

export default function Register() {
  const navigate = useNavigate();
  const { loginWithFirebase } = useAuth();
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading]         = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    try {
      await api.post('/auth/register', data);
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      await loginWithFirebase();
      toast.success('Account created with Google!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <CheckCircle size={32} className="text-brand-mid mx-auto mb-3" />
          <h1 className="font-serif text-3xl text-brand-dark">Create your account</h1>
          <p className="text-gray-500 text-sm mt-2">Set up your organization on CertiChain</p>
        </div>

        <div className="card">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 border border-brand-border rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {googleLoading ? 'Signing up…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-brand-border" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or register with email</span>
            <hr className="flex-1 border-brand-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Your name</label>
                <input className="input" {...register('name')} />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" {...register('email')} />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
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
              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <hr className="border-brand-border" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization Details</p>

            <div>
              <label className="label">Organization name</label>
              <input className="input" {...register('organizationName')} />
              {errors.organizationName && <p className="text-red-600 text-xs mt-1">{errors.organizationName.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Organization type</label>
                <select className="input" {...register('organizationType')}>
                  <option value="">Select type…</option>
                  {orgTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.organizationType && <p className="text-red-600 text-xs mt-1">{errors.organizationType.message}</p>}
              </div>
              <div>
                <label className="label">Website (optional)</label>
                <input className="input" placeholder="https://" {...register('website')} />
                {errors.website && <p className="text-red-600 text-xs mt-1">{errors.website.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || googleLoading} className="btn-primary w-full py-3">
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-mid font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
