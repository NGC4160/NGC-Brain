import { redirect } from "next/navigation"

import { StaticAppGate } from "@/components/demo/static-app-gate"
import { AppShell } from "@/components/layout/app-shell"
import { auth } from "@/lib/auth"
import { DEMO_ACCOUNTS, isStaticExport } from "@/lib/static"

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isStaticExport()) {
    const demoUserFromEnvOrDefault =
      DEMO_ACCOUNTS.find(
        (account) => account.email === process.env.NEXT_PUBLIC_DEMO_EMAIL
      ) ?? DEMO_ACCOUNTS[0]

    return (
      <StaticAppGate defaultUser={demoUserFromEnvOrDefault}>
        {children}
      </StaticAppGate>
    )
  }

  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return <AppShell user={session.user}>{children}</AppShell>
}
