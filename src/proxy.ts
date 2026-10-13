import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing and an optimistic gate for private pages.
 *
 * - English is served at the root ("/paths") and rewritten internally to "/en/paths".
 * - Arabic is served under "/ar" and needs no rewrite.
 * - "/en/..." is redirected to the unprefixed URL, so every page has one canonical address.
 * - Private pages without a session cookie redirect to login before rendering. The real
 *   check (session lookup and expiry, role checks) happens on the server for every request.
 */
const PRIVATE = ["/dashboard", "/account", "/admin"];

function isPrivate(path: string) {
  return PRIVATE.some((p) => path === p || path.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const arabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const path = arabic ? pathname.slice(3) || "/" : pathname;

  if (isPrivate(path) && !request.cookies.has("qa_session")) {
    const url = request.nextUrl.clone();
    url.pathname = arabic ? "/ar/login" : "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (arabic) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|templates/|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
