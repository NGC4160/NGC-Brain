import type { Role } from "@prisma/client"

export type { Role }

export type Resource =
  | "dashboard"
  | "admin"
  | "users"
  | "customers"
  | "workOrders"
  | "estimates"
  | "invoices"
  | "payments"
  | "inventory"
  | "purchaseOrders"
  | "vendors"
  | "dispatch"
  | "driver"
  | "shopFloor"
  | "reports"
  | "settings"
  | "messages"
  | "leads"
  | "priceBook"
  | "readOnly"

const allResources: readonly Resource[] = [
  "dashboard",
  "admin",
  "users",
  "customers",
  "workOrders",
  "estimates",
  "invoices",
  "payments",
  "inventory",
  "purchaseOrders",
  "vendors",
  "dispatch",
  "driver",
  "shopFloor",
  "reports",
  "settings",
  "messages",
  "leads",
  "priceBook",
  "readOnly",
] as const

export const roleHomeRoutes: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard",
  OWNER: "/dashboard",
  MANAGER: "/dashboard",
  SERVICE_ADVISOR: "/dashboard",
  SHOP_TECHNICIAN: "/shop-floor",
  PARTS_MANAGER: "/dashboard",
  DISPATCHER: "/dispatch",
  PICKUP_DRIVER: "/driver",
  DELIVERY_DRIVER: "/driver",
  ACCOUNTANT: "/invoices",
  READ_ONLY: "/dashboard",
}

export const defaultRoleHomeRoute = "/dashboard"

const rolePermissions: Record<Role, readonly Resource[]> = {
  SUPER_ADMIN: allResources,
  OWNER: allResources,
  MANAGER: allResources,
  SERVICE_ADVISOR: [
    "dashboard",
    "customers",
    "workOrders",
    "estimates",
    "invoices",
    "dispatch",
    "messages",
    "leads",
    "priceBook",
  ],
  SHOP_TECHNICIAN: [
    "dashboard",
    "shopFloor",
    "workOrders",
    "inventory",
    "messages",
    "readOnly",
  ],
  PARTS_MANAGER: [
    "dashboard",
    "inventory",
    "purchaseOrders",
    "vendors",
    "workOrders",
    "priceBook",
    "messages",
  ],
  DISPATCHER: [
    "dashboard",
    "dispatch",
    "driver",
    "customers",
    "workOrders",
    "messages",
  ],
  PICKUP_DRIVER: ["driver", "dispatch", "workOrders", "messages", "readOnly"],
  DELIVERY_DRIVER: ["driver", "dispatch", "workOrders", "messages", "readOnly"],
  ACCOUNTANT: [
    "dashboard",
    "customers",
    "invoices",
    "payments",
    "reports",
    "readOnly",
  ],
  READ_ONLY: ["dashboard", "reports", "readOnly"],
}

export function canAccess(role: Role | null | undefined, resource: Resource) {
  if (!role) {
    return false
  }

  return rolePermissions[role]?.includes(resource) ?? false
}

export function getRoleHomeRoute(role: Role | null | undefined) {
  if (!role) {
    return defaultRoleHomeRoute
  }

  return roleHomeRoutes[role] ?? defaultRoleHomeRoute
}

export function hasAnyRole(
  role: Role | null | undefined,
  allowedRoles: readonly Role[],
) {
  return Boolean(role && allowedRoles.includes(role))
}

export function isDriverRole(role: Role | null | undefined) {
  return role === "PICKUP_DRIVER" || role === "DELIVERY_DRIVER"
}
