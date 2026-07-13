/** GitHub Pages / static export helpers */

export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1"
}

export function appBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || ""
}

export const DEMO_PASSWORD = "demo1234"

export type DemoRole =
  | "OWNER"
  | "MANAGER"
  | "SERVICE_ADVISOR"
  | "SHOP_TECHNICIAN"
  | "PARTS_MANAGER"
  | "DISPATCHER"
  | "PICKUP_DRIVER"
  | "DELIVERY_DRIVER"
  | "ACCOUNTANT"

export const DEMO_ACCOUNTS: Array<{
  email: string
  role: DemoRole
  name: string
  label: string
}> = [
  { email: "owner@ngc.demo", role: "OWNER", name: "Ryan Owner", label: "Owner" },
  {
    email: "manager@ngc.demo",
    role: "MANAGER",
    name: "Christine Manager",
    label: "Manager",
  },
  {
    email: "dispatch@ngc.demo",
    role: "DISPATCHER",
    name: "Dana Dispatcher",
    label: "Dispatcher",
  },
  {
    email: "tech@ngc.demo",
    role: "SHOP_TECHNICIAN",
    name: "Peyton Technician",
    label: "Technician",
  },
  {
    email: "pickup@ngc.demo",
    role: "PICKUP_DRIVER",
    name: "Pat Pickup",
    label: "Pickup Driver",
  },
  {
    email: "delivery@ngc.demo",
    role: "DELIVERY_DRIVER",
    name: "Devon Delivery",
    label: "Delivery Driver",
  },
]
