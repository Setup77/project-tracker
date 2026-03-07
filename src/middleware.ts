import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/utils/auth"

export function middleware(request: NextRequest) {

  const token = request.cookies.get("token")?.value

  const protectedRoutes = ["/dashboard"]

  if (protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )) {

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const valid = verifyToken(token)

    if (!valid) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}