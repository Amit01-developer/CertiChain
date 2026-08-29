import { describe, it, expect } from 'vitest';
import { getDashboardRouteForRole } from './dashboardRole';

describe('getDashboardRouteForRole', () => {
  it('redirects staff users to the staff dashboard', () => {
    expect(getDashboardRouteForRole('STAFF')).toBe('/dashboard/staff');
  });

  it('keeps admin and owner users on the main dashboard', () => {
    expect(getDashboardRouteForRole('ADMIN')).toBe('/dashboard');
    expect(getDashboardRouteForRole('OWNER')).toBe('/dashboard');
  });

  it('defaults to the main dashboard when no role is present', () => {
    expect(getDashboardRouteForRole()).toBe('/dashboard');
  });
});
