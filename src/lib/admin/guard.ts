import "server-only";
import { getCurrentUser, hasRole, requireUser, type CurrentUser } from "@/lib/auth/dal";

/**
 * For admin pages. Not signed in: redirect to login. Signed in without the role: returns null so
 * the page can explain the lack of access (never a silent redirect that hides why).
 * Every admin server action checks again on its own.
 */
export async function requireStaffPage(next: string): Promise<CurrentUser | null> {
  const user = await requireUser(next);
  return hasRole(user, "instructor") ? user : null;
}

export async function requireAdminPage(next: string): Promise<CurrentUser | null> {
  const user = await requireUser(next);
  return user.roles.includes("admin") ? user : null;
}

/** For admin server actions: returns the user, or null when not allowed. */
export async function staffUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && hasRole(user, "instructor") ? user : null;
}

export async function adminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && user.roles.includes("admin") ? user : null;
}
