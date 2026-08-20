import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const schema = z.object({
  name:         z.string().min(1, 'Required'),
  layout:       z.enum(['landscape', 'portrait']),
  primaryColor: z.string(),
  accentColor:  z.string(),
  showQR:       z.boolean(),
  showLogo:     z.boolean(),
});
type Form = z.infer<typeof schema>;

export default function NewTemplate() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { layout: 'landscape', primaryColor: '#112a29', accentColor: '#ddf05c', showQR: true, showLogo: true },
  });

  async function onSubmit(data: Form) {
    const { name, ...config } = data;
    await api.post(`/organizations/${orgId}/templates`, { name, configuration: config });
    toast.success('Template created.');
    navigate('/dashboard/templates');
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-2">New Template</h1>
      <p className="text-gray-500 mb-8">Configure how your certificates will look.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Template Name *</label>
          <input className="input" placeholder="e.g. Standard Completion Certificate" {...register('name')} />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Layout</label>
          <select className="input" {...register('layout')}>
            <option value="landscape">Landscape (A4)</option>
            <option value="portrait">Portrait (A4)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" className="h-10 w-14 border border-brand-border cursor-pointer" {...register('primaryColor')} />
              <input className="input flex-1" {...register('primaryColor')} />
            </div>
          </div>
          <div>
            <label className="label">Accent Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" className="h-10 w-14 border border-brand-border cursor-pointer" {...register('accentColor')} />
              <input className="input flex-1" {...register('accentColor')} />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showQR')} />
            <span className="text-sm text-gray-600">Include QR code</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showLogo')} />
            <span className="text-sm text-gray-600">Include organization logo</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3">
            {isSubmitting ? 'Creating…' : 'Create Template'}
          </button>
          <Link to="/dashboard/templates" className="btn-secondary px-6 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
