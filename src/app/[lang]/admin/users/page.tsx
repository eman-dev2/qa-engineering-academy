import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, like, or } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { requireAdminPage } from "@/lib/admin/guard";
import { updateUserRoles } from "@/app/actions/admin";
import { formatDateValue, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { StatusBadge } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminLoading, Forbidden } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/users">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.usersNav };
}

export default async function AdminUsersPage({ params, searchParams }: PageProps<"/[lang]/admin/users">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <Users locale={locale} t={t} searchParams={searchParams} />
    </Suspense>
  );
}

async function Users({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/admin/users">["searchParams"] }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireAdminPage(L("/admin/users"));
  if (!user) return <Forbidden t={t} adminOnly />;
  const rawQ = (await searchParams).q;
  const q = typeof rawQ === "string" ? rawQ.trim().slice(0, 100) : "";
  const db = getDb();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const users = db
    .select({ id: s.users.id, name: s.users.name, email: s.users.email, isDemo: s.users.isDemo, createdAt: s.users.createdAt })
    .from(s.users)
    .where(q ? or(like(s.users.email, pattern), like(s.users.name, pattern)) : undefined)
    .orderBy(desc(s.users.createdAt))
    .limit(50)
    .all();
  const roleRows = db.select().from(s.userRoles).all();

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.usersNav}</h1>
        <p className="mt-2 max-w-[70ch] text-ink-2">{t.admin.users.lead}</p>
      </div>
      <form role="search" action={L("/admin/users")} className="flex max-w-xl gap-2">
        <label htmlFor="user-q" className="sr-only">
          {t.admin.users.search}
        </label>
        <input
          id="user-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t.admin.users.search}
          className="h-11 flex-1 rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-3"
        />
        <button type="submit" className="h-11 rounded-md bg-pen px-4 font-semibold text-on-pen hover:bg-pen-hover">
          {t.admin.users.searchButton}
        </button>
      </form>
      {users.length === 0 ? (
        <p className="text-ink-2">{t.admin.users.noUsers}</p>
      ) : (
        <ul className="space-y-4">
          {users.map((u) => {
            const current = roleRows.filter((r) => r.userId === u.id).map((r) => r.role as string);
            return (
              <li key={u.id} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {u.name} {u.isDemo && <StatusBadge label={t.admin.users.demo} tone="warn" />}
                    </p>
                    <p className="ltr text-sm text-ink-2">{u.email}</p>
                  </div>
                  <p className="text-sm text-ink-3">
                    {t.admin.users.joined}: {formatDateValue(locale, u.createdAt)}
                  </p>
                </div>
                <AdminForm action={updateUserRoles} locale={locale} className="mt-4 space-y-3" submitLabel={t.admin.users.updateRoles} pendingLabel={t.common.saving}>
                  <input type="hidden" name="userId" value={u.id} />
                  <fieldset>
                    <legend className="text-sm font-medium">{t.admin.users.roles}</legend>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                      {roles.map((r) => (
                        <label key={r} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="roles"
                            value={r}
                            defaultChecked={current.includes(r)}
                            disabled={r === "learner"}
                            className="h-4 w-4 accent-[var(--pen)]"
                          />
                          {t.admin.users.roleNames[r]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </AdminForm>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
