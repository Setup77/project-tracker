import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // On définit les zones protégées (Dashboard et Membres)
  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/members");

  // 1️⃣ Utilisateur NON connecté → Redirection vers /login s'il tente d'accéder à une page protégée
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2️⃣ Utilisateur connecté → Redirection vers /dashboard s'il tente d'aller sur login/register
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Le matcher est déjà correct dans ton code, il couvre bien les routes nécessaires
  matcher: ["/dashboard/:path*", "/members/:path*", "/login", "/register"],
};
