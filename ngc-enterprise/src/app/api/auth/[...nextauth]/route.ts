import { NextResponse, type NextRequest } from "next/server"

function staticAuthDisabled() {
  return NextResponse.json(
    { error: "Auth API is disabled for the static demo." },
    { status: 404 }
  )
}

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return staticAuthDisabled()
  }

  const { handlers } = await import("@/lib/auth")
  return handlers.GET(request)
}

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return staticAuthDisabled()
  }

  const { handlers } = await import("@/lib/auth")
  return handlers.POST(request)
}
