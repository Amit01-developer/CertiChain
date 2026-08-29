import type { OrgMemberRole } from '../types';

type DashboardRole = OrgMemberRole | 'USER' | 'SUPER_ADMIN' | null | undefined;

export function getDashboardRouteForRole(role?: DashboardRole): string {
  return role === 'STAFF' ? '/dashboard/staff' : '/dashboard';
}

export function getDashboardTitleForRole(role?: DashboardRole): string {
  return role === 'STAFF' ? 'Staff Dashboard' : 'Admin Dashboard';
}
