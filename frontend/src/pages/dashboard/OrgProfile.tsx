import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Upload } from 'lucide-react';

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  type:        z.string().min(1, 'Required'),
  email:       z.string().email('Valid email required'),
  phone:       z.string().optional(),
  address:     z.string().optional(),
  website:     z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const orgTypes = ['University', 'School', 'College', 'Company', 'NGO', 'Training Institute', 'Event Organizer', 'Other'];

export default function OrgProfile() {
  const { organization, setOrg } = useAuth();
  const orgId = organization?.id ?? '';

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (organization) reset(organization as any);
  }, [organization, reset]);

  async function onSubmit(data: Form) {
    const res = await api.put(`/organizations/${orgId}`, data);
    setOrg(res.data.data);
    toast.success('Organization updated.');
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    const res = await api.post(`/organizations/${orgId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success('Logo updated.');
    setOrg({ ...organization!, logoUrl: res.data.data.logoUrl });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-8">Organization Profile</h1>

      {/* Logo */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center overflow-hidden border border-brand-border shrink-0">
          {organization?.logoUrl
            ? <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            : <Building2 size={28} className="text-gray-400" />}
        </div>
        <div>
          <p className="font-semibold text-brand-dark mb-1">Organization Logo</p>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer text-sm">
            <Upload size={14} /> Upload Logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG or SVG. Max 2 MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Organization Name *</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" {...register('type')}>
              {orgTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Email *</label>
            <input type="email" className="input" {...register('email')} />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" placeholder="https://" {...register('website')} />
          {errors.website && <p className="text-red-600 text-xs mt-1">{errors.website.message}</p>}
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input h-20 resize-none" {...register('description')} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
