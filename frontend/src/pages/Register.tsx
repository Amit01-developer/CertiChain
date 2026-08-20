import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name:             z.string().min(2, 'Name required'),
  email:            z.string().email('Valid email required'),
  password:         z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Include uppercase').regex(/[0-9]/, 'Include a number'),
  confirmPassword:  z.string(),
  organizationName: z.string().min(2, 'Organization name required'),
  organizationType: z.string().min(1, 'Select a type'),
  website:          z.string().url('Valid URL').optional().or(z.literal('')),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type Form = z.infer<typeof schema>;

const orgTypes = ['University', 'School', 'College', 'Company', 'NGO', 'Training Institute', 'Event Organizer', 'Other'];

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    try {
      await api.post('/auth/register', data);
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
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
                <input type="password" className="input" {...register('password')} />
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input type="password" className="input" {...register('confirmPassword')} />
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

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
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
