import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const schema = z.object({
  password:        z.string().min(8, 'Min 8 chars'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type Form = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token') ?? '';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: Form) {
    await api.post('/auth/reset-password', { token, password });
    toast.success('Password reset. Please log in.');
    navigate('/login');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-brand-dark mb-8 text-center">Set new password</h1>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input type="password" className="input" {...register('password')} />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
          <p className="text-center text-sm mt-4"><Link to="/login" className="text-brand-mid hover:underline">Back to login</Link></p>
        </div>
      </div>
    </div>
  );
}
