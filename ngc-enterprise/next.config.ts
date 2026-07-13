import type { NextConfig } from "next"

const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1"
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
const staticActionStub = "./src/lib/static-actions.ts"
const staticActionAliases = {
  "@/lib/actions/work-orders": staticActionStub,
  "@/lib/actions/invoices": staticActionStub,
  "@/lib/actions/estimates": staticActionStub,
  "@/lib/actions/customers": staticActionStub,
  "@/lib/actions/price-book": staticActionStub,
  "@/lib/actions/inventory": staticActionStub,
  "@/lib/actions/dispatch": staticActionStub,
  "@/lib/actions/shop-floor": staticActionStub,
}

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  basePath: isStatic && basePath ? basePath : undefined,
  assetPrefix: isStatic && basePath ? basePath : undefined,
  trailingSlash: isStatic,
  pageExtensions: isStatic ? ["tsx", "jsx", "js"] : undefined,
  images: {
    unoptimized: isStatic,
  },
  poweredByHeader: false,
  turbopack: isStatic
    ? {
        resolveAlias: staticActionAliases,
      }
    : undefined,
  // Avoid bundling server-only packages into static client demos incorrectly
  serverExternalPackages: isStatic ? [] : ["@prisma/client", "bcryptjs"],
}

export default nextConfig
