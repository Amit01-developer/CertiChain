import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Include uppercase').regex(/[0-9]/, 'Include a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PwForm = z.infer<typeof pwSchema>;

const memberSchema = z.object({
  email: z.string().email('Valid email required'),
  role:  z.enum(['ADMIN', 'STAFF']),
});
type MemberForm = z.infer<typeof memberSchema>;

export default function Settings() {
  const { organization, setOrg } = useAuth();
  const orgId = organization?.id ?? '';
  const [addOpen, setAddOpen] = useState(false);

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });
  async function onPwSubmit(data: PwForm) {
    try {
      await api.put('/auth/me/password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated.');
      pwForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    }
  }

  const memberForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema), defaultValues: { role: 'STAFF' } });
  async function onAddMember(data: MemberForm) {
    try {
      await api.post(`/organizations/${orgId}/members`, data);
      toast.success('Member added.');
      setAddOpen(false);
      memberForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    }
  }

  const members: any[] = (organization as any)?.members ?? [];

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-serif text-3xl text-brand-dark">Settings</h1>

      <div className="card">
        <h2 className="font-serif text-xl text-brand-dark mb-5">Change Password</h2>
        <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" {...pwForm.register('currentPassword')} />
            {pwForm.formState.errors.currentPassword && (
              <p className="text-red-600 text-xs mt-1">{pwForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" {...pwForm.register('newPassword')} />
              {pwForm.formState.errors.newPassword && (
                <p className="text-red-600 text-xs mt-1">{pwForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" {...pwForm.register('confirmPassword')} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{pwForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <button type="submit" disabled={pwForm.formState.isSubmitting} className="btn-primary px-6 py-2.5">
            {pwForm.formState.isSubmitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-brand-dark">Organization Members</h2>
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
            <UserPlus size={14} /> Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">No members found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="pb-3 font-semibold text-xs text-gray-500">Name</th>
                <th className="pb-3 font-semibold text-xs text-gray-500">Email</th>
                <th className="pb-3 font-semibold text-xs text-gray-500">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id} className="border-b border-brand-border/50">
                  <td className="py-2.5 font-medium text-brand-dark">{m.user?.name ?? '—'}</td>
                  <td className="py-2.5 text-gray-500">{m.user?.email ?? '—'}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-sm ${roleColors[m.role] ?? ''}`}>
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Member">
        <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input type="email" className="input" {...memberForm.register('email')} />
            {memberForm.formState.errors.email && (
              <p className="text-red-600 text-xs mt-1">{memberForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...memberForm.register('role')}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={memberForm.formState.isSubmitting} className="btn-primary flex-1 py-2.5">
              {memberForm.formState.isSubmitting ? 'Adding…' : 'Add Member'}
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
