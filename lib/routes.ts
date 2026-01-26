import type { UserRole } from './RoleContext';

/**
 * Get the home route for a specific role
 */
export function getHomeRoute(role: UserRole): string {
  return `/${role}`;
}

/**
 * Get the jobs route for a specific role
 */
export function getJobsRoute(role: UserRole): string {
  return `/${role}/jobs`;
}

/**
 * Get the profile route for a specific role
 */
export function getProfileRoute(role: UserRole): string {
  return `/${role}/profile`;
}

/**
 * Get the create job route (PO only)
 */
export function getCreateJobRoute(): string {
  return '/PO/create-job';
}

/**
 * Get the applications route (FL only)
 */
export function getApplicationsRoute(): string {
  return '/FL/applications';
}

/**
 * Switch from current role to the other role
 */
export function switchRoleRoute(currentRole: UserRole): string {
  return currentRole === 'PO' ? '/FL' : '/PO';
}

/**
 * Check if a path belongs to a specific role
 */
export function isRoleRoute(path: string, role: UserRole): boolean {
  return path.startsWith(`/${role}/`) || path === `/${role}`;
}

/**
 * Extract role from current pathname
 * Returns undefined if not on a role-specific route
 */
export function getRoleFromPath(pathname: string): UserRole | undefined {
  if (pathname.startsWith('/PO/') || pathname === '/PO') return 'PO';
  if (pathname.startsWith('/FL/') || pathname === '/FL') return 'FL';
  return undefined;
}
