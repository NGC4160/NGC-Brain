import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "NGC Enterprise",
    template: "%s | NGC Enterprise",
  },
  description:
    "Shop-Based Service Operations Platform for pickup, repair, delivery, and growth.",
  applicationName: "NGC Enterprise",
  appleWebApp: {
    capable: true,
    title: "NGC Enterprise",
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#2563EB",
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
