import Link from "next/link";
import { getCurrentUser, hasRole } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { AccountMenu } from "./account-menu";
import { buttonClass, cx } from "./ui";

export async function UserMenu({ locale, t, compact = false }: { locale: Locale; t: Dictionary; compact?: boolean }) {
  const L = (p: string) => localePath(locale, p);
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-1 whitespace-nowrap"}>
        <Link href={L("/login")} className={buttonClass("quiet")}>
          {t.nav.login}
        </Link>
        <Link href={L("/signup")} className={buttonClass("primary")}>
          {t.nav.signup}
        </Link>
      </div>
    );
  }
  const item = compact ? buttonClass("quiet", "w-full justify-start") : "block rounded-md px-3 py-2 text-start text-[0.95rem] font-medium text-ink hover:bg-surface-2";
  const items = (
    <>
      {hasRole(user, "instructor") && (
        <Link href={L("/admin")} className={item}>
          {t.nav.admin}
        </Link>
      )}
      <Link href={L("/account")} className={item}>
        {t.nav.account}
      </Link>
      <form action={logout}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={cx(item, "w-full")}>
          {t.nav.logout}
        </button>
      </form>
    </>
  );
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <Link href={L("/dashboard")} className={buttonClass("secondary")}>
          {t.nav.dashboard}
        </Link>
        {items}
      </div>
    );
  }
  const firstName = user.name.split(/\s+/)[0] || user.name;
  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <Link href={L("/dashboard")} className={buttonClass("secondary")}>
        {t.nav.dashboard}
      </Link>
      <AccountMenu label={firstName}>{items}</AccountMenu>
    </div>
  );
}
