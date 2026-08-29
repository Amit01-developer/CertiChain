import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { Users, UserPlus, Trash2, Mail, Clock, ShieldCheck, Shield, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OrgMember, PendingInvite, OrgMemberRole } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

const roleMeta: Record<OrgMemberRole, { label: string; cls: string; Icon: React.ElementType }> = {
  OWNER: { label: 'Owner',  cls: 'bg-purple-100 text-purple-800', Icon: Crown       },
  ADMIN: { label: 'Admin',  cls: 'bg-blue-100   text-blue-800',   Icon: ShieldCheck },
  STAFF: { label: 'Staff',  cls: 'bg-green-100  text-green-800',  Icon: Shield      },
};

function RoleBadge({ role }: { role: OrgMemberRole }) {
  const { label, cls, Icon } = roleMeta[role];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 ${cls}`}>
      <Icon size={10} /> {label}
    </span>
  );
}

export default function Members() {
  const { organization, organization: org } = useAuth();
  const orgId    = org?.id ?? '';
  const myRole   = organization?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const [members,  setMembers]  = useState<OrgMember[]>([]);
  const [invites,  setInvites]  = useState<PendingInvite[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Invite modal
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting,    setInviting]    = useState(false);

  // Remove confirm modal
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removing,     setRemoving]     = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await api.get(`/organizations/${orgId}/members`);
      setMembers(r.data.data.members ?? []);
      setInvites(r.data.data.pendingInvites ?? []);
    } finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const r = await api.post(`/organizations/${orgId}/invitations`, { email: inviteEmail.trim() });
      toast.success(r.data.message ?? 'Invitation sent.');
      setInviteEmail('');
      setInviteOpen(false);
      load();
    } catch {
      // error toast already shown by api interceptor
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/organizations/${orgId}/members/${removeTarget.id}`);
      toast.success('Member removed.');
      setRemoveTarget(null);
      load();
    } catch {
      // error toast already shown by api interceptor
    } finally {
      setRemoving(false);
    }
  }

  async function handleCancelInvite(inviteId: string, email: string) {
    try {
      await api.delete(`/organizations/${orgId}/invitations/${inviteId}`);
      toast.success(`Invitation to ${email} cancelled.`);
      load();
    } catch { /* toast shown by interceptor */ }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{org?.name}</p>
        </div>
        {canManage && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Add Staff
          </button>
        )}
      </div>

      {/* Active members */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-brand-mid" />
          <h2 className="font-serif text-xl text-brand-dark">
            Active Members <span className="text-gray-400 text-base font-sans ml-1">({members.length})</span>
          </h2>
        </div>

        {members.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  {['Member', 'Email', 'Role', 'Joined', ...(canManage ? ['Actions'] : [])].map(h => (
                    <th key={h} className="pb-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-3 font-medium text-brand-dark">{m.user.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{m.user.email}</td>
                    <td className="py-3"><RoleBadge role={m.role} /></td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(m.createdAt)}</td>
                    {canManage && (
                      <td className="py-3">
                        {m.role !== 'OWNER' && !(myRole === 'ADMIN' && m.role === 'ADMIN') && (
                          <button
                            onClick={() => setRemoveTarget(m)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove member"
                            aria-label={`Remove ${m.user.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {canManage && invites.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-amber-500" />
            <h2 className="font-serif text-xl text-brand-dark">
              Pending Invitations <span className="text-gray-400 text-base font-sans ml-1">({invites.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  {['Email', 'Role', 'Expires', 'Actions'].map(h => (
                    <th key={h} className="pb-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => (
                  <tr key={inv.id} className="border-b border-brand-border/50">
                    <td className="py-3">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Mail size={13} className="text-gray-400" /> {inv.email}
                      </span>
                    </td>
                    <td className="py-3"><RoleBadge role={inv.role} /></td>
                    <td className="py-3 text-gray-400 text-xs">{fmt(inv.expiresAt)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleCancelInvite(inv.id, inv.email)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Cancel invitation for ${inv.email}`}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail(''); }} title="Add Staff Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter an email address. If the person has a CertiChain account they will be added immediately.
            Otherwise a secure invitation link will be emailed to them.
          </p>
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              className="input"
              placeholder="staff@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="bg-brand-cream border border-brand-border px-3 py-2.5 text-xs text-gray-600">
            <strong>Role:</strong> Staff — can issue certificates and participate in reviews. Cannot revoke, manage members, or access analytics.
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={inviting} className="btn-primary flex-1 py-2.5">
              {inviting ? 'Sending…' : 'Send Invitation'}
            </button>
            <button type="button" onClick={() => setInviteOpen(false)} className="btn-secondary px-5 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove confirm modal */}
      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Member">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <strong>{removeTarget?.user.name}</strong> ({removeTarget?.user.email}) from the organization?
            They will lose access immediately.
          </p>
          <div className="flex gap-3">
            <button onClick={handleRemove} disabled={removing} className="btn-danger flex-1 py-2.5">
              {removing ? 'Removing…' : 'Remove Member'}
            </button>
            <button onClick={() => setRemoveTarget(null)} className="btn-secondary px-6 py-2.5">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
