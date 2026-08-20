import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    await api.post('/auth/forgot-password', data);
    toast.success('If that email exists, a reset link has been sent.');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-brand-dark mb-2 text-center">Reset password</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Enter your email and we'll send you a reset link.</p>
        <div className="card">
          {isSubmitSuccessful ? (
            <p className="text-center text-brand-mid font-medium py-4">Check your inbox for the reset link.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" {...register('email')} />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/login" className="text-brand-mid hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
