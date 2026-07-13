import { describe, expect, it } from "vitest"
import { cn, formatCurrency, initials } from "../src/lib/utils"
import { canAccess, getRoleHomeRoute } from "../src/lib/rbac"

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toContain("px-4")
  })

  it("formats currency", () => {
    expect(formatCurrency(179)).toBe("$179.00")
  })

  it("builds initials", () => {
    expect(initials("Ryan Owner")).toBe("RO")
  })
})

describe("rbac", () => {
  it("routes drivers to driver app", () => {
    expect(getRoleHomeRoute("PICKUP_DRIVER")).toBe("/driver")
    expect(getRoleHomeRoute("DELIVERY_DRIVER")).toBe("/driver")
  })

  it("routes techs to shop floor", () => {
    expect(getRoleHomeRoute("SHOP_TECHNICIAN")).toBe("/shop-floor")
  })

  it("allows owners broad access", () => {
    expect(canAccess("OWNER", "settings")).toBe(true)
  })
})
