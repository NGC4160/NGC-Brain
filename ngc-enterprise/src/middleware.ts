import { NextResponse, type NextRequest } from "next/server"

const publicPrefixes = ["/login", "/signup", "/api/auth", "/portal"]

const protectedPrefixes = [
  "/dashboard",
  "/shop-floor",
  "/schedule",
  "/dispatch",
  "/work-orders",
  "/estimates",
  "/invoices",
  "/customers",
  "/leads",
  "/price-book",
  "/inventory",
  "/communications",
  "/marketing",
  "/reports",
  "/team",
  "/settings",
  "/driver",
  "/profile",
]

const sessionCookieNames = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function hasSessionCookie(request: NextRequest) {
  return sessionCookieNames.some((name) => Boolean(request.cookies.get(name)))
}

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (pathname === "/" || startsWithAny(pathname, publicPrefixes)) {
    return NextResponse.next()
  }

  if (!startsWithAny(pathname, protectedPrefixes)) {
    return NextResponse.next()
  }

  const authConfigured = Boolean(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  )

  if (!authConfigured || hasSessionCookie(request)) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
