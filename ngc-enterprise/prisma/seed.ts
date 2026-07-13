import "dotenv/config"
import { hash } from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  BayStatus,
  DispatchStatus,
  DispatchType,
  EstimateStatus,
  InventoryTxnType,
  InvoiceStatus,
  LeadStatus,
  LineItemType,
  MessageChannel,
  PaymentMethod,
  PrismaClient,
  Role,
  WorkOrderStatus,
} from "@prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const DEMO_ORG_SLUG = "ngc"
const DEMO_PASSWORD = "demo1234"
const TAX_RATE = 0.092

const demoUsers = [
  {
    email: "owner@ngc.demo",
    role: Role.OWNER,
    name: "Ryan Owner",
    firstName: "Ryan",
    lastName: "Owner",
  },
  {
    email: "manager@ngc.demo",
    role: Role.MANAGER,
    name: "Christine Manager",
    firstName: "Christine",
    lastName: "Manager",
  },
  {
    email: "advisor@ngc.demo",
    role: Role.SERVICE_ADVISOR,
    name: "Samantha Advisor",
    firstName: "Samantha",
    lastName: "Advisor",
  },
  {
    email: "tech@ngc.demo",
    role: Role.SHOP_TECHNICIAN,
    name: "Peyton Technician",
    firstName: "Peyton",
    lastName: "Technician",
  },
  {
    email: "parts@ngc.demo",
    role: Role.PARTS_MANAGER,
    name: "Morgan Parts",
    firstName: "Morgan",
    lastName: "Parts",
  },
  {
    email: "dispatch@ngc.demo",
    role: Role.DISPATCHER,
    name: "Dana Dispatch",
    firstName: "Dana",
    lastName: "Dispatch",
  },
  {
    email: "pickup@ngc.demo",
    role: Role.PICKUP_DRIVER,
    name: "Chris Pickup",
    firstName: "Chris",
    lastName: "Pickup",
  },
  {
    email: "delivery@ngc.demo",
    role: Role.DELIVERY_DRIVER,
    name: "Taylor Delivery",
    firstName: "Taylor",
    lastName: "Delivery",
  },
  {
    email: "accounting@ngc.demo",
    role: Role.ACCOUNTANT,
    name: "Avery Accounting",
    firstName: "Avery",
    lastName: "Accounting",
  },
]

type DemoUserKey =
  | "owner"
  | "manager"
  | "advisor"
  | "tech"
  | "parts"
  | "dispatch"
  | "pickup"
  | "delivery"
  | "accounting"

type LineSeed = {
  type: LineItemType
  name: string
  description?: string
  quantity?: number
  unitCost?: number
  unitPrice: number
  taxable?: boolean
  priceBookSku?: string
  inventorySku?: string
}

function daysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function calculateTotals(lines: LineSeed[]) {
  const subtotal = roundCurrency(
    lines.reduce(
      (sum, line) => sum + (line.quantity ?? 1) * line.unitPrice,
      0,
    ),
  )
  const taxTotal = roundCurrency(
    lines.reduce((sum, line) => {
      if (line.taxable === false) {
        return sum
      }

      return sum + (line.quantity ?? 1) * line.unitPrice * TAX_RATE
    }, 0),
  )
  const laborTotal = roundCurrency(
    lines
      .filter((line) => line.type === LineItemType.LABOR)
      .reduce((sum, line) => sum + (line.quantity ?? 1) * line.unitPrice, 0),
  )
  const partsTotal = roundCurrency(
    lines
      .filter((line) => line.type === LineItemType.PART)
      .reduce((sum, line) => sum + (line.quantity ?? 1) * line.unitPrice, 0),
  )

  return {
    subtotal,
    taxTotal,
    laborTotal,
    partsTotal,
    grandTotal: roundCurrency(subtotal + taxTotal),
  }
}

function buildLineItemData(
  lines: LineSeed[],
  priceBookBySku: Record<string, { id: string }>,
  inventoryBySku: Record<string, { id: string }>,
) {
  return lines.map((line, sortOrder) => ({
    type: line.type,
    name: line.name,
    description: line.description,
    quantity: line.quantity ?? 1,
    unitCost: line.unitCost ?? 0,
    unitPrice: line.unitPrice,
    taxRate: line.taxable === false ? 0 : TAX_RATE,
    priceBookItemId: line.priceBookSku
      ? priceBookBySku[line.priceBookSku]?.id
      : undefined,
    inventoryItemId: line.inventorySku
      ? inventoryBySku[line.inventorySku]?.id
      : undefined,
    sortOrder,
  }))
}

async function cleanupDemoOrganization() {
  const organization = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
    select: { id: true },
  })

  if (!organization) {
    return
  }

  const [
    users,
    locations,
    customers,
    workOrders,
    estimates,
    invoices,
    priceBookItems,
    inventoryItems,
    servicePlans,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.location.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.customer.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.workOrder.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.estimate.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.priceBookItem.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
    prisma.servicePlan.findMany({
      where: { organizationId: organization.id },
      select: { id: true },
    }),
  ])

  const userIds = users.map((user) => user.id)
  const locationIds = locations.map((location) => location.id)
  const customerIds = customers.map((customer) => customer.id)
  const workOrderIds = workOrders.map((workOrder) => workOrder.id)
  const estimateIds = estimates.map((estimate) => estimate.id)
  const invoiceIds = invoices.map((invoice) => invoice.id)
  const priceBookItemIds = priceBookItems.map((item) => item.id)
  const inventoryItemIds = inventoryItems.map((item) => item.id)
  const servicePlanIds = servicePlans.map((plan) => plan.id)

  await prisma.payment.deleteMany({
    where: {
      OR: [
        { customerId: { in: customerIds } },
        { invoiceId: { in: invoiceIds } },
      ],
    },
  })
  await prisma.inventoryTxn.deleteMany({
    where: { inventoryItemId: { in: inventoryItemIds } },
  })
  await prisma.partsReservation.deleteMany({
    where: {
      OR: [
        { workOrderId: { in: workOrderIds } },
        { inventoryItemId: { in: inventoryItemIds } },
      ],
    },
  })
  await prisma.stockLevel.deleteMany({
    where: {
      OR: [
        { inventoryItemId: { in: inventoryItemIds } },
        { locationId: { in: locationIds } },
      ],
    },
  })
  await prisma.lineItem.deleteMany({
    where: {
      OR: [
        { workOrderId: { in: workOrderIds } },
        { estimateId: { in: estimateIds } },
        { invoiceId: { in: invoiceIds } },
        { priceBookItemId: { in: priceBookItemIds } },
        { inventoryItemId: { in: inventoryItemIds } },
      ],
    },
  })
  await prisma.dispatch.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.timeEntry.deleteMany({
    where: {
      OR: [
        { workOrderId: { in: workOrderIds } },
        { userId: { in: userIds } },
      ],
    },
  })
  await prisma.workOrderAssignment.deleteMany({
    where: {
      OR: [
        { workOrderId: { in: workOrderIds } },
        { userId: { in: userIds } },
      ],
    },
  })
  await prisma.workOrderChecklist.deleteMany({
    where: { workOrderId: { in: workOrderIds } },
  })
  await prisma.attachment.deleteMany({
    where: { workOrderId: { in: workOrderIds } },
  })
  await prisma.activity.deleteMany({
    where: { workOrderId: { in: workOrderIds } },
  })
  await prisma.invoice.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.workOrder.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.estimate.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.communication.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.notification.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.auditLog.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.customerServicePlan.deleteMany({
    where: {
      OR: [
        { customerId: { in: customerIds } },
        { servicePlanId: { in: servicePlanIds } },
      ],
    },
  })
  await prisma.servicePlan.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.lead.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.contact.deleteMany({
    where: { customerId: { in: customerIds } },
  })
  await prisma.address.deleteMany({
    where: { customerId: { in: customerIds } },
  })
  await prisma.equipment.deleteMany({
    where: { customerId: { in: customerIds } },
  })
  await prisma.customer.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.purchaseOrder.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.inventoryItem.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.vendor.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.priceBookItem.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.userLocation.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { locationId: { in: locationIds } },
      ],
    },
  })
  await prisma.session.deleteMany({
    where: { userId: { in: userIds } },
  })
  await prisma.account.deleteMany({
    where: { userId: { in: userIds } },
  })
  await prisma.invitation.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.user.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.bay.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.vehicle.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.messageTemplate.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.customFieldDef.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.jobTemplate.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.checklistTemplate.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.taxRate.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.workOrderStatusDef.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.tag.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.location.deleteMany({
    where: { organizationId: organization.id },
  })
  await prisma.organization.delete({
    where: { id: organization.id },
  })
}

async function main() {
  await cleanupDemoOrganization()

  const passwordHash = await hash(DEMO_PASSWORD, 12)

  const organization = await prisma.organization.create({
    data: {
      name: "Neighborhood Golf Carts",
      slug: DEMO_ORG_SLUG,
      legalName: "Neighborhood Golf Carts LLC",
      phone: "985-402-1206",
      email: "contact@ngcgolfcarts.com",
      website: "https://ngcgolfcarts.com",
      primaryColor: "#166534",
      timezone: "America/Chicago",
      plan: "ENTERPRISE",
      featureFlags: {
        dispatch: true,
        inventory: true,
        customerPortal: true,
        lithiumWorkflow: true,
      },
      settings: {
        shopOnly: true,
        diagnosticMinimum: 179,
        pickupDelivery: "Free within 40 miles Northshore",
      },
    },
  })

  const location = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: "Covington Shop",
      code: "COV",
      address1: "71363 Thelma Ln",
      address2: "Suite E",
      city: "Covington",
      state: "LA",
      postalCode: "70433",
      phone: "985-402-1206",
      email: "contact@ngcgolfcarts.com",
      latitude: 30.4755,
      longitude: -90.1009,
      isPrimary: true,
      timezone: "America/Chicago",
      hours: {
        monday: "8:00 AM - 5:00 PM",
        tuesday: "8:00 AM - 5:00 PM",
        wednesday: "8:00 AM - 5:00 PM",
        thursday: "8:00 AM - 5:00 PM",
        friday: "8:00 AM - 5:00 PM",
      },
    },
  })

  const users = {} as Record<DemoUserKey, { id: string; email: string }>

  for (const demoUser of demoUsers) {
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: demoUser.email,
        passwordHash,
        name: demoUser.name,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        role: demoUser.role,
        isActive: true,
        skills:
          demoUser.role === Role.SHOP_TECHNICIAN
            ? ["diagnostics", "lithium-conversions", "quality-control"]
            : [],
        preferences: {
          theme: "system",
          defaultLocationId: location.id,
        },
      },
      select: { id: true, email: true },
    })

    const key = demoUser.email.split("@")[0] as DemoUserKey
    users[key] = user
  }

  await prisma.userLocation.createMany({
    data: Object.values(users).map((user) => ({
      userId: user.id,
      locationId: location.id,
      isDefault: true,
    })),
  })

  const bays = await Promise.all(
    [1, 2, 3, 4].map((bayNumber) =>
      prisma.bay.create({
        data: {
          organizationId: organization.id,
          locationId: location.id,
          name: `Bay ${bayNumber}`,
          code: `BAY-${bayNumber}`,
          status: bayNumber <= 2 ? BayStatus.BUSY : BayStatus.OPEN,
          sortOrder: bayNumber,
          capacity: 1,
        },
      }),
    ),
  )

  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        organizationId: organization.id,
        locationId: location.id,
        name: "NGC Pickup Rig",
        plateNumber: "NGC-PU1",
        capacity: 2,
      },
    }),
    prisma.vehicle.create({
      data: {
        organizationId: organization.id,
        locationId: location.id,
        name: "NGC Delivery Trailer",
        plateNumber: "NGC-DL1",
        capacity: 3,
      },
    }),
  ])

  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        organizationId: organization.id,
        name: "Eco Battery",
        email: "orders@ecobattery.demo",
        phone: "555-0101",
        website: "https://ecobattery.example",
        accountNumber: "DEMO-ECO-001",
        notes: "Primary Professional lithium kit supplier for demo data.",
      },
    }),
    prisma.vendor.create({
      data: {
        organizationId: organization.id,
        name: "Nivel Parts",
        email: "parts@nivel.demo",
        phone: "555-0102",
        website: "https://nivel.example",
        accountNumber: "DEMO-NIVEL-001",
      },
    }),
  ])

  const priceBookItems = await Promise.all(
    [
      {
        sku: "DIAG-001",
        name: "Diagnostic",
        description:
          "Shop diagnostic minimum; applies toward repair on known-issue jobs.",
        category: "Service",
        type: LineItemType.SERVICE,
        unitCost: 0,
        unitPrice: 179,
        taxable: false,
        isFavorite: true,
      },
      {
        sku: "LAB-SHOP",
        name: "Shop Labor",
        description: "General shop labor hourly rate.",
        category: "Labor",
        type: LineItemType.LABOR,
        unitCost: 45,
        unitPrice: 125,
        taxable: false,
        isFavorite: true,
      },
      {
        sku: "LAB-LITHIUM",
        name: "Lithium Conversion Labor",
        description: "Flat-rate professional lithium conversion labor.",
        category: "Labor",
        subcategory: "Lithium",
        type: LineItemType.LABOR,
        unitCost: 650,
        unitPrice: 1500,
        taxable: false,
        isFavorite: true,
      },
      {
        sku: "KIT-PRO-36V",
        name: "Professional 36V Lithium Kit",
        category: "Lithium",
        type: LineItemType.PART,
        unitCost: 2250,
        unitPrice: 3195,
        isFavorite: true,
      },
      {
        sku: "KIT-PRO-48V",
        name: "Professional 48V Lithium Kit",
        category: "Lithium",
        type: LineItemType.PART,
        unitCost: 2750,
        unitPrice: 3795,
        isFavorite: true,
      },
      {
        sku: "KIT-PRO-MINI",
        name: "Professional MINI Lithium Kit",
        category: "Lithium",
        type: LineItemType.PART,
        unitCost: 1995,
        unitPrice: 2995,
        isFavorite: true,
      },
      {
        sku: "KIT-PRO-72V",
        name: "Professional 72V Lithium Kit",
        category: "Lithium",
        type: LineItemType.PART,
        unitCost: 4250,
        unitPrice: 5995,
        isFavorite: true,
      },
      {
        sku: "KIT-PRO-150AH",
        name: "Professional 150AH Lithium Kit",
        category: "Lithium",
        type: LineItemType.PART,
        unitCost: 3450,
        unitPrice: 4995,
        isFavorite: true,
      },
      {
        sku: "CHG-48V-LI",
        name: "48V Lithium Charger",
        category: "Parts",
        subcategory: "Chargers",
        type: LineItemType.PART,
        unitCost: 260,
        unitPrice: 429,
      },
      {
        sku: "TIRE-205-50-10",
        name: "205/50-10 Tire",
        category: "Parts",
        subcategory: "Tires",
        type: LineItemType.PART,
        unitCost: 58,
        unitPrice: 119,
      },
      {
        sku: "BRAKE-SHOE",
        name: "Brake Shoe Set",
        category: "Parts",
        subcategory: "Brakes",
        type: LineItemType.PART,
        unitCost: 34,
        unitPrice: 79,
      },
      {
        sku: "SOL-48V",
        name: "48V Heavy Duty Solenoid",
        category: "Parts",
        subcategory: "Electrical",
        type: LineItemType.PART,
        unitCost: 74,
        unitPrice: 149,
      },
    ].map((item) =>
      prisma.priceBookItem.create({
        data: {
          organizationId: organization.id,
          ...item,
          metadata:
            item.category === "Lithium"
              ? { warrantyYears: 5, line: "Professional" }
              : {},
        },
      }),
    ),
  )

  const priceBookBySku = Object.fromEntries(
    priceBookItems
      .filter((item) => item.sku)
      .map((item) => [item.sku as string, { id: item.id }]),
  )

  const inventoryItems = await Promise.all(
    [
      {
        sku: "KIT-PRO-36V",
        name: "Professional 36V Lithium Kit",
        category: "Lithium Kits",
        unitCost: 2250,
        unitPrice: 3195,
        reorderPoint: 1,
        reorderQty: 2,
        trackSerial: true,
        vendorId: vendors[0].id,
        quantityOnHand: 2,
      },
      {
        sku: "KIT-PRO-48V",
        name: "Professional 48V Lithium Kit",
        category: "Lithium Kits",
        unitCost: 2750,
        unitPrice: 3795,
        reorderPoint: 2,
        reorderQty: 3,
        trackSerial: true,
        vendorId: vendors[0].id,
        quantityOnHand: 4,
      },
      {
        sku: "KIT-PRO-MINI",
        name: "Professional MINI Lithium Kit",
        category: "Lithium Kits",
        unitCost: 1995,
        unitPrice: 2995,
        reorderPoint: 1,
        reorderQty: 2,
        trackSerial: true,
        vendorId: vendors[0].id,
        quantityOnHand: 1,
      },
      {
        sku: "KIT-PRO-72V",
        name: "Professional 72V Lithium Kit",
        category: "Lithium Kits",
        unitCost: 4250,
        unitPrice: 5995,
        reorderPoint: 1,
        reorderQty: 1,
        trackSerial: true,
        vendorId: vendors[0].id,
        quantityOnHand: 1,
      },
      {
        sku: "KIT-PRO-150AH",
        name: "Professional 150AH Lithium Kit",
        category: "Lithium Kits",
        unitCost: 3450,
        unitPrice: 4995,
        reorderPoint: 1,
        reorderQty: 2,
        trackSerial: true,
        vendorId: vendors[0].id,
        quantityOnHand: 2,
      },
      {
        sku: "CHG-48V-LI",
        name: "48V Lithium Charger",
        category: "Chargers",
        unitCost: 260,
        unitPrice: 429,
        reorderPoint: 2,
        reorderQty: 4,
        vendorId: vendors[0].id,
        quantityOnHand: 5,
      },
      {
        sku: "TIRE-205-50-10",
        name: "205/50-10 Tire",
        category: "Tires",
        unitCost: 58,
        unitPrice: 119,
        reorderPoint: 8,
        reorderQty: 16,
        vendorId: vendors[1].id,
        quantityOnHand: 24,
      },
      {
        sku: "BRAKE-SHOE",
        name: "Brake Shoe Set",
        category: "Brakes",
        unitCost: 34,
        unitPrice: 79,
        reorderPoint: 6,
        reorderQty: 12,
        vendorId: vendors[1].id,
        quantityOnHand: 18,
      },
      {
        sku: "SOL-48V",
        name: "48V Heavy Duty Solenoid",
        category: "Electrical",
        unitCost: 74,
        unitPrice: 149,
        reorderPoint: 3,
        reorderQty: 6,
        vendorId: vendors[1].id,
        quantityOnHand: 7,
      },
      {
        sku: "CBL-2GA-KIT",
        name: "2 Gauge Cable Kit",
        category: "Electrical",
        unitCost: 82,
        unitPrice: 169,
        reorderPoint: 4,
        reorderQty: 8,
        vendorId: vendors[1].id,
        quantityOnHand: 10,
      },
    ].map(async (item) => {
      const { quantityOnHand, ...data } = item
      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          organizationId: organization.id,
          locationId: location.id,
          ...data,
        },
      })

      await prisma.stockLevel.create({
        data: {
          inventoryItemId: inventoryItem.id,
          locationId: location.id,
          quantityOnHand,
          quantityReserved: 0,
        },
      })

      await prisma.inventoryTxn.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: InventoryTxnType.RECEIVE,
          quantity: quantityOnHand,
          reference: "DEMO-OPENING-STOCK",
          notes: "Opening demo stock level.",
          createdById: users.parts.id,
        },
      })

      return inventoryItem
    }),
  )

  const inventoryBySku = Object.fromEntries(
    inventoryItems
      .filter((item) => item.sku)
      .map((item) => [item.sku as string, { id: item.id }]),
  )

  await prisma.purchaseOrder.create({
    data: {
      organizationId: organization.id,
      vendorId: vendors[0].id,
      number: "PO-3001",
      status: "SENT",
      orderedAt: daysFromNow(-2),
      expectedAt: daysFromNow(5),
      subtotal: 11750,
      notes: "Demo replenishment PO for lithium kits and chargers.",
      lineItems: [
        {
          sku: "KIT-PRO-48V",
          name: "Professional 48V Lithium Kit",
          quantity: 3,
          unitCost: 2750,
        },
        {
          sku: "KIT-PRO-150AH",
          name: "Professional 150AH Lithium Kit",
          quantity: 1,
          unitCost: 3450,
        },
        {
          sku: "CHG-48V-LI",
          name: "48V Lithium Charger",
          quantity: 4,
          unitCost: 260,
        },
      ],
    },
  })

  const taxRate = await prisma.taxRate.create({
    data: {
      organizationId: organization.id,
      name: "Louisiana Sales Tax",
      rate: TAX_RATE,
      isDefault: true,
    },
  })

  await prisma.checklistTemplate.createMany({
    data: [
      {
        organizationId: organization.id,
        name: "Final Quality Control",
        category: "QC",
        items: [
          { id: "torque", label: "Torque wheels and steering fasteners", required: true },
          { id: "brakes", label: "Verify brake operation", required: true },
          { id: "lights", label: "Verify lights and horn", required: true },
          { id: "road-test", label: "Complete road test", required: true },
          { id: "photos", label: "Attach final condition photos", required: false },
        ],
      },
      {
        organizationId: organization.id,
        name: "Lithium Install",
        category: "Lithium",
        items: [
          { id: "remove-lead-acid", label: "Remove lead-acid batteries", required: true },
          { id: "mount-kit", label: "Mount Professional lithium kit", required: true },
          { id: "route-cables", label: "Route and secure cables", required: true },
          { id: "bms-check", label: "Verify BMS app readings", required: true },
          { id: "charger", label: "Pair and test charger", required: true },
          { id: "warranty", label: "Register 5-year battery and BMS warranty", required: true },
        ],
      },
    ],
  })

  await prisma.workOrderStatusDef.createMany({
    data: [
      ["RECEIVED", "Received", "#64748B", 10, false],
      ["DIAGNOSIS", "Diagnosis", "#0EA5E9", 20, false],
      ["AWAITING_APPROVAL", "Awaiting Approval", "#F59E0B", 30, false],
      ["AWAITING_PARTS", "Awaiting Parts", "#D97706", 40, false],
      ["IN_PROGRESS", "In Progress", "#2563EB", 50, false],
      ["QUALITY_CHECK", "Quality Check", "#7C3AED", 60, false],
      ["READY_FOR_PICKUP", "Ready for Pickup", "#16A34A", 70, false],
      ["READY_FOR_DELIVERY", "Ready for Delivery", "#16A34A", 80, false],
      ["COMPLETED", "Completed", "#15803D", 90, true],
      ["DELIVERED", "Delivered", "#15803D", 100, true],
      ["PICKED_UP", "Picked Up", "#15803D", 110, true],
      ["CANCELLED", "Cancelled", "#DC2626", 120, true],
      ["ON_HOLD", "On Hold", "#6B7280", 130, false],
    ].map(([key, label, color, sortOrder, isTerminal]) => ({
      organizationId: organization.id,
      key: key as string,
      label: label as string,
      color: color as string,
      sortOrder: sortOrder as number,
      isTerminal: isTerminal as boolean,
      customerVisible: key !== "ON_HOLD",
    })),
  })

  await prisma.messageTemplate.createMany({
    data: [
      {
        organizationId: organization.id,
        name: "Estimate Sent",
        channel: MessageChannel.SMS,
        trigger: "ESTIMATE_SENT",
        body: "Hi {{customer.firstName}}, your NGC estimate {{estimate.number}} is ready to review: {{estimate.url}}",
      },
      {
        organizationId: organization.id,
        name: "Cart Ready",
        channel: MessageChannel.SMS,
        trigger: "WORK_ORDER_READY",
        body: "Good news - {{equipment.name}} is ready at Neighborhood Golf Carts. Reply here with pickup questions.",
      },
      {
        organizationId: organization.id,
        name: "Delivery Reminder",
        channel: MessageChannel.EMAIL,
        subject: "Your NGC delivery is scheduled",
        trigger: "DISPATCH_REMINDER",
        body: "Your cart delivery is scheduled for {{dispatch.windowStart}}-{{dispatch.windowEnd}}. We will notify you when the driver is en route.",
      },
      {
        organizationId: organization.id,
        name: "Review Request",
        channel: MessageChannel.SMS,
        trigger: "REVIEW_REQUEST",
        body: "Thanks for choosing NGC. If we earned it, would you leave us a quick review? {{review.url}}",
      },
    ],
  })

  await prisma.tag.createMany({
    data: [
      { organizationId: organization.id, name: "Lithium Lead", color: "#16A34A" },
      { organizationId: organization.id, name: "Fleet", color: "#2563EB" },
      { organizationId: organization.id, name: "Warranty", color: "#7C3AED" },
      { organizationId: organization.id, name: "Rush", color: "#DC2626" },
    ],
  })

  await prisma.customFieldDef.createMany({
    data: [
      {
        organizationId: organization.id,
        entityType: "EQUIPMENT",
        key: "batteryVoltage",
        label: "Battery Voltage",
        fieldType: "SELECT",
        options: ["36V", "48V", "72V"],
      },
      {
        organizationId: organization.id,
        entityType: "WORK_ORDER",
        key: "pickupZone",
        label: "Pickup Zone",
        fieldType: "SELECT",
        options: ["Northshore", "Southshore", "Outside 40mi"],
      },
    ],
  })

  const customers = await Promise.all(
    [
      {
        displayName: "Beau Chene HOA",
        companyName: "Beau Chene HOA",
        email: "facilities@beauchene.demo",
        phone: "555-1101",
        tags: ["Fleet"],
        leadSource: "Referral",
        address: {
          address1: "100 Fairway Dr",
          city: "Mandeville",
          state: "LA",
          postalCode: "70471",
        },
        contact: {
          firstName: "Jordan",
          lastName: "Fields",
          role: "Facilities Manager",
        },
        equipment: {
          name: "Club Car Carryall",
          make: "Club Car",
          model: "Carryall",
          year: 2019,
          color: "White",
          serialNumber: "DEMO-CC-1001",
        },
      },
      {
        displayName: "Northlake Estates",
        companyName: "Northlake Estates",
        email: "hoa@northlake.demo",
        phone: "555-1102",
        tags: ["Fleet", "Lithium Lead"],
        leadSource: "Website",
        address: {
          address1: "52 Lake Vista Blvd",
          city: "Covington",
          state: "LA",
          postalCode: "70433",
        },
        contact: {
          firstName: "Casey",
          lastName: "Miller",
          role: "HOA Treasurer",
        },
        equipment: {
          name: "EZGO TXT",
          make: "EZGO",
          model: "TXT",
          year: 2017,
          color: "Forest Green",
          serialNumber: "DEMO-EZ-1002",
        },
      },
      {
        displayName: "Madisonville Marina",
        companyName: "Madisonville Marina",
        email: "ops@madisonvillemarina.demo",
        phone: "555-1103",
        tags: ["Fleet"],
        leadSource: "Google",
        address: {
          address1: "402 Dockside Rd",
          city: "Madisonville",
          state: "LA",
          postalCode: "70447",
        },
        contact: {
          firstName: "Riley",
          lastName: "Boudreaux",
          role: "Operations",
        },
        equipment: {
          name: "Yamaha Concierge 4",
          make: "Yamaha",
          model: "Concierge 4",
          year: 2020,
          color: "Blue",
          serialNumber: "DEMO-YA-1003",
        },
      },
      {
        displayName: "Stone Creek Club",
        companyName: "Stone Creek Club",
        email: "maintenance@stonecreek.demo",
        phone: "555-1104",
        tags: ["Lithium Lead"],
        leadSource: "Repeat Customer",
        address: {
          address1: "1201 Stone Creek Blvd",
          city: "Covington",
          state: "LA",
          postalCode: "70433",
        },
        contact: {
          firstName: "Drew",
          lastName: "Landry",
          role: "Maintenance Lead",
        },
        equipment: {
          name: "Club Car Precedent",
          make: "Club Car",
          model: "Precedent",
          year: 2016,
          color: "Black",
          serialNumber: "DEMO-CC-1004",
        },
      },
      {
        displayName: "Abita Springs Retreat",
        companyName: "Abita Springs Retreat",
        email: "guestservices@abitasprings.demo",
        phone: "555-1105",
        tags: [],
        leadSource: "Facebook",
        address: {
          address1: "18 Pine Grove Way",
          city: "Abita Springs",
          state: "LA",
          postalCode: "70420",
        },
        contact: {
          firstName: "Alex",
          lastName: "Nguyen",
          role: "Guest Services",
        },
        equipment: {
          name: "EZGO RXV",
          make: "EZGO",
          model: "RXV",
          year: 2018,
          color: "Silver",
          serialNumber: "DEMO-EZ-1005",
        },
      },
      {
        displayName: "Slidell Bayou Carts",
        companyName: "Slidell Bayou Carts",
        email: "service@slidellbayou.demo",
        phone: "555-1106",
        tags: ["Rush"],
        leadSource: "Referral",
        address: {
          address1: "908 Bayou Ln",
          city: "Slidell",
          state: "LA",
          postalCode: "70458",
        },
        contact: {
          firstName: "Morgan",
          lastName: "LeBlanc",
          role: "Owner",
        },
        equipment: {
          name: "Advanced EV Advent",
          make: "Advanced EV",
          model: "Advent",
          year: 2021,
          color: "Red",
          serialNumber: "DEMO-AE-1006",
        },
      },
      {
        displayName: "Covington Family Cart",
        email: "familycart@covington.demo",
        phone: "555-1107",
        tags: ["Warranty"],
        leadSource: "Walk-in",
        address: {
          address1: "711 Magnolia St",
          city: "Covington",
          state: "LA",
          postalCode: "70433",
        },
        contact: {
          firstName: "Jamie",
          lastName: "Harris",
          role: "Owner",
        },
        equipment: {
          name: "Icon i40",
          make: "Icon",
          model: "i40",
          year: 2022,
          color: "White",
          serialNumber: "DEMO-IC-1007",
        },
      },
      {
        displayName: "Hammond Campus Services",
        companyName: "Hammond Campus Services",
        email: "fleet@hammondcampus.demo",
        phone: "555-1108",
        tags: ["Fleet", "Lithium Lead"],
        leadSource: "Trade Show",
        address: {
          address1: "2400 University Ave",
          city: "Hammond",
          state: "LA",
          postalCode: "70401",
        },
        contact: {
          firstName: "Skyler",
          lastName: "Thomas",
          role: "Fleet Coordinator",
        },
        equipment: {
          name: "Club Car Villager 6",
          make: "Club Car",
          model: "Villager 6",
          year: 2018,
          color: "Tan",
          serialNumber: "DEMO-CC-1008",
        },
      },
    ].map((customer) =>
      prisma.customer.create({
        data: {
          organizationId: organization.id,
          displayName: customer.displayName,
          companyName: customer.companyName,
          email: customer.email,
          phone: customer.phone,
          billingEmail: customer.email,
          tags: customer.tags,
          leadSource: customer.leadSource,
          notes: "Demo customer seeded for NGC Enterprise workflows.",
          lifetimeValue: 0,
          contacts: {
            create: {
              ...customer.contact,
              email: customer.email,
              phone: customer.phone,
              isPrimary: true,
            },
          },
          addresses: {
            create: {
              label: "Primary",
              ...customer.address,
              isPrimary: true,
              isBilling: true,
            },
          },
          equipment: {
            create: {
              ...customer.equipment,
              customFields: {
                batteryVoltage:
                  customer.equipment.model === "TXT" ? "48V" : "36V",
              },
            },
          },
        },
        include: {
          addresses: true,
          equipment: true,
        },
      }),
    ),
  )

  const servicePlan = await prisma.servicePlan.create({
    data: {
      organizationId: organization.id,
      name: "Annual Fleet Care",
      description: "Annual preventive maintenance plan for commercial carts.",
      intervalMonths: 12,
      price: 399,
      benefits: [
        "Annual inspection",
        "Priority shop scheduling",
        "Battery health report",
      ],
      subscriptions: {
        create: {
          customerId: customers[0].id,
          startsAt: daysFromNow(-60),
          status: "ACTIVE",
        },
      },
    },
  })

  await prisma.jobTemplate.create({
    data: {
      organizationId: organization.id,
      name: "Professional Lithium Conversion",
      description:
        "Standard workflow for Professional lithium conversion line.",
      estimatedHours: 6,
      lineItems: [
        { sku: "DIAG-001", quantity: 1 },
        { sku: "LAB-LITHIUM", quantity: 1 },
        { sku: "KIT-PRO-48V", quantity: 1 },
        { sku: "CHG-48V-LI", quantity: 1 },
      ],
    },
  })

  const estimateDefinitions = [
    {
      number: "EST-2001",
      title: "48V Professional Lithium Conversion",
      status: EstimateStatus.APPROVED,
      customer: customers[1],
      sentAt: daysFromNow(-7),
      approvedAt: daysFromNow(-5),
      lines: [
        {
          type: LineItemType.SERVICE,
          name: "Diagnostic",
          unitPrice: 179,
          taxable: false,
          priceBookSku: "DIAG-001",
        },
        {
          type: LineItemType.LABOR,
          name: "Lithium Conversion Labor",
          unitPrice: 1500,
          taxable: false,
          priceBookSku: "LAB-LITHIUM",
        },
        {
          type: LineItemType.PART,
          name: "Professional 48V Lithium Kit",
          unitCost: 2750,
          unitPrice: 3795,
          priceBookSku: "KIT-PRO-48V",
          inventorySku: "KIT-PRO-48V",
        },
        {
          type: LineItemType.PART,
          name: "48V Lithium Charger",
          unitCost: 260,
          unitPrice: 429,
          priceBookSku: "CHG-48V-LI",
          inventorySku: "CHG-48V-LI",
        },
      ],
    },
    {
      number: "EST-2002",
      title: "36V Lithium Upgrade",
      status: EstimateStatus.SENT,
      customer: customers[3],
      sentAt: daysFromNow(-2),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Lithium Conversion Labor",
          unitPrice: 1500,
          taxable: false,
          priceBookSku: "LAB-LITHIUM",
        },
        {
          type: LineItemType.PART,
          name: "Professional 36V Lithium Kit",
          unitCost: 2250,
          unitPrice: 3195,
          priceBookSku: "KIT-PRO-36V",
          inventorySku: "KIT-PRO-36V",
        },
      ],
    },
    {
      number: "EST-2003",
      title: "Fleet Preventive Maintenance",
      status: EstimateStatus.VIEWED,
      customer: customers[0],
      sentAt: daysFromNow(-4),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 6,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
        {
          type: LineItemType.PART,
          name: "Brake Shoe Set",
          quantity: 3,
          unitCost: 34,
          unitPrice: 79,
          priceBookSku: "BRAKE-SHOE",
          inventorySku: "BRAKE-SHOE",
        },
      ],
    },
    {
      number: "EST-2004",
      title: "Tires and Brake Service",
      status: EstimateStatus.APPROVED,
      customer: customers[5],
      sentAt: daysFromNow(-8),
      approvedAt: daysFromNow(-6),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 2,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
        {
          type: LineItemType.PART,
          name: "205/50-10 Tire",
          quantity: 4,
          unitCost: 58,
          unitPrice: 119,
          priceBookSku: "TIRE-205-50-10",
          inventorySku: "TIRE-205-50-10",
        },
        {
          type: LineItemType.PART,
          name: "Brake Shoe Set",
          quantity: 1,
          unitCost: 34,
          unitPrice: 79,
          priceBookSku: "BRAKE-SHOE",
          inventorySku: "BRAKE-SHOE",
        },
      ],
    },
  ]

  const estimates = await Promise.all(
    estimateDefinitions.map((definition) => {
      const totals = calculateTotals(definition.lines)

      return prisma.estimate.create({
        data: {
          organizationId: organization.id,
          customerId: definition.customer.id,
          number: definition.number,
          title: definition.title,
          status: definition.status,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          grandTotal: totals.grandTotal,
          expiresAt: daysFromNow(21),
          sentAt: definition.sentAt,
          approvedAt: definition.approvedAt,
          notes: "Demo estimate generated by seed script.",
          customerNotes:
            "Pricing includes shop labor and parts shown. Lithium kits include 5-year battery and BMS warranty.",
          selectedOption: "recommended",
          options: {
            recommended: {
              label: "Recommended",
              total: totals.grandTotal,
            },
          },
          lineItems: {
            createMany: {
              data: buildLineItemData(
                definition.lines,
                priceBookBySku,
                inventoryBySku,
              ),
            },
          },
        },
      })
    }),
  )

  const qcChecklistItems = [
    {
      id: "torque",
      label: "Torque wheels and steering fasteners",
      required: true,
      completed: false,
    },
    {
      id: "brakes",
      label: "Verify brake operation",
      required: true,
      completed: false,
    },
    {
      id: "road-test",
      label: "Complete road test",
      required: true,
      completed: false,
    },
  ]

  const lithiumChecklistItems = [
    {
      id: "remove-lead-acid",
      label: "Remove lead-acid batteries",
      required: true,
      completed: true,
      completedAt: daysFromNow(-1).toISOString(),
    },
    {
      id: "bms-check",
      label: "Verify BMS app readings",
      required: true,
      completed: false,
    },
    {
      id: "warranty",
      label: "Register 5-year battery and BMS warranty",
      required: true,
      completed: false,
    },
  ]

  const workOrderDefinitions = [
    {
      number: "WO-1001",
      title: "Intermittent Power Loss Diagnostic",
      description: "Customer reports intermittent power loss under load.",
      status: WorkOrderStatus.DIAGNOSIS,
      priority: 2,
      customer: customers[6],
      equipment: customers[6].equipment[0],
      bay: bays[0],
      tags: ["Warranty"],
      intakeSource: "WALK_IN",
      lines: [
        {
          type: LineItemType.SERVICE,
          name: "Diagnostic",
          unitPrice: 179,
          taxable: false,
          priceBookSku: "DIAG-001",
        },
      ],
    },
    {
      number: "WO-1002",
      title: "48V Professional Lithium Conversion",
      description: "Approved conversion from EST-2001.",
      status: WorkOrderStatus.IN_PROGRESS,
      priority: 1,
      customer: customers[1],
      equipment: customers[1].equipment[0],
      bay: bays[1],
      estimateId: estimates[0].id,
      tags: ["Lithium Lead", "Rush"],
      intakeSource: "ESTIMATE",
      startedAt: daysFromNow(-1),
      lines: estimateDefinitions[0].lines,
      checklists: [{ name: "Lithium Install", items: lithiumChecklistItems }],
    },
    {
      number: "WO-1003",
      title: "Fleet Preventive Maintenance",
      description: "Annual service for HOA utility cart.",
      status: WorkOrderStatus.AWAITING_APPROVAL,
      priority: 3,
      customer: customers[0],
      equipment: customers[0].equipment[0],
      tags: ["Fleet"],
      intakeSource: "BOOKING",
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 2,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
        {
          type: LineItemType.PART,
          name: "Brake Shoe Set",
          quantity: 1,
          unitCost: 34,
          unitPrice: 79,
          priceBookSku: "BRAKE-SHOE",
          inventorySku: "BRAKE-SHOE",
        },
      ],
    },
    {
      number: "WO-1004",
      title: "Tire and Brake Service",
      description: "Approved tires and brake shoes.",
      status: WorkOrderStatus.QUALITY_CHECK,
      priority: 2,
      customer: customers[5],
      equipment: customers[5].equipment[0],
      bay: bays[2],
      tags: ["Rush"],
      intakeSource: "PICKUP",
      startedAt: daysFromNow(-2),
      lines: estimateDefinitions[3].lines,
      checklists: [{ name: "Final Quality Control", items: qcChecklistItems }],
    },
    {
      number: "WO-1005",
      title: "Solenoid Replacement",
      description: "No-click condition, awaiting solenoid confirmation.",
      status: WorkOrderStatus.AWAITING_PARTS,
      priority: 3,
      customer: customers[2],
      equipment: customers[2].equipment[0],
      intakeSource: "PICKUP",
      lines: [
        {
          type: LineItemType.SERVICE,
          name: "Diagnostic",
          unitPrice: 179,
          taxable: false,
          priceBookSku: "DIAG-001",
        },
        {
          type: LineItemType.PART,
          name: "48V Heavy Duty Solenoid",
          unitCost: 74,
          unitPrice: 149,
          priceBookSku: "SOL-48V",
          inventorySku: "SOL-48V",
        },
      ],
    },
    {
      number: "WO-1006",
      title: "Charger Replacement",
      description: "48V charger failed output test.",
      status: WorkOrderStatus.READY_FOR_PICKUP,
      priority: 4,
      customer: customers[4],
      equipment: customers[4].equipment[0],
      intakeSource: "WALK_IN",
      completedAt: daysFromNow(-1),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 1,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
        {
          type: LineItemType.PART,
          name: "48V Lithium Charger",
          unitCost: 260,
          unitPrice: 429,
          priceBookSku: "CHG-48V-LI",
          inventorySku: "CHG-48V-LI",
        },
      ],
    },
    {
      number: "WO-1007",
      title: "72V Professional Lithium Install",
      description: "High-capacity lithium conversion intake.",
      status: WorkOrderStatus.RECEIVED,
      priority: 2,
      customer: customers[7],
      equipment: customers[7].equipment[0],
      tags: ["Lithium Lead", "Fleet"],
      intakeSource: "BOOKING",
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Lithium Conversion Labor",
          unitPrice: 1500,
          taxable: false,
          priceBookSku: "LAB-LITHIUM",
        },
        {
          type: LineItemType.PART,
          name: "Professional 72V Lithium Kit",
          unitCost: 4250,
          unitPrice: 5995,
          priceBookSku: "KIT-PRO-72V",
          inventorySku: "KIT-PRO-72V",
        },
      ],
    },
    {
      number: "WO-1008",
      title: "Steering Service",
      description: "Tightened steering column and replaced worn bushings.",
      status: WorkOrderStatus.COMPLETED,
      priority: 4,
      customer: customers[3],
      equipment: customers[3].equipment[0],
      intakeSource: "WALK_IN",
      completedAt: daysFromNow(-3),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 1.5,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
      ],
    },
    {
      number: "WO-1009",
      title: "Delivery Prep and Final Detail",
      description: "Final check before scheduled delivery.",
      status: WorkOrderStatus.READY_FOR_DELIVERY,
      priority: 3,
      customer: customers[2],
      equipment: customers[2].equipment[0],
      intakeSource: "SHOP",
      completedAt: daysFromNow(-1),
      lines: [
        {
          type: LineItemType.LABOR,
          name: "Shop Labor",
          quantity: 1,
          unitPrice: 125,
          taxable: false,
          priceBookSku: "LAB-SHOP",
        },
      ],
      checklists: [{ name: "Final Quality Control", items: qcChecklistItems }],
    },
    {
      number: "WO-1010",
      title: "Pickup Intake Inspection",
      description: "Initial intake after pickup; waiting on customer notes.",
      status: WorkOrderStatus.ON_HOLD,
      priority: 5,
      customer: customers[0],
      equipment: customers[0].equipment[0],
      tags: ["Fleet"],
      intakeSource: "PICKUP",
      lines: [
        {
          type: LineItemType.SERVICE,
          name: "Diagnostic",
          unitPrice: 179,
          taxable: false,
          priceBookSku: "DIAG-001",
        },
      ],
    },
  ]

  const workOrders = await Promise.all(
    workOrderDefinitions.map((definition, index) => {
      const totals = calculateTotals(definition.lines)

      return prisma.workOrder.create({
        data: {
          organizationId: organization.id,
          locationId: location.id,
          customerId: definition.customer.id,
          equipmentId: definition.equipment.id,
          estimateId: definition.estimateId,
          number: definition.number,
          title: definition.title,
          description: definition.description,
          status: definition.status,
          priority: definition.priority,
          promisedDate: daysFromNow(index % 3 === 0 ? 1 : index + 2),
          receivedAt: daysFromNow(-index - 1),
          startedAt: definition.startedAt,
          completedAt: definition.completedAt,
          bayId: definition.bay?.id,
          internalNotes: "Seeded demo work order for NGC Enterprise.",
          customerNotes:
            definition.status === WorkOrderStatus.AWAITING_APPROVAL
              ? "Estimate sent for approval."
              : undefined,
          tags: definition.tags ?? [],
          intakeSource: definition.intakeSource,
          laborTotal: totals.laborTotal,
          partsTotal: totals.partsTotal,
          taxTotal: totals.taxTotal,
          grandTotal: totals.grandTotal,
          lineItems: {
            createMany: {
              data: buildLineItemData(
                definition.lines,
                priceBookBySku,
                inventoryBySku,
              ),
            },
          },
          assignments: {
            createMany: {
              data: [
                {
                  userId: users.tech.id,
                  role:
                    definition.status === WorkOrderStatus.IN_PROGRESS
                      ? "LEAD_TECH"
                      : "TECHNICIAN",
                },
              ],
            },
          },
          checklists: definition.checklists
            ? {
                create: definition.checklists,
              }
            : undefined,
        },
      })
    }),
  )

  await prisma.timeEntry.createMany({
    data: [
      {
        workOrderId: workOrders[1].id,
        userId: users.tech.id,
        startedAt: daysFromNow(-1),
        endedAt: daysFromNow(-1),
        durationMin: 210,
        notes: "Removed lead-acid pack and staged lithium components.",
      },
      {
        workOrderId: workOrders[3].id,
        userId: users.tech.id,
        startedAt: daysFromNow(-2),
        endedAt: daysFromNow(-2),
        durationMin: 155,
        notes: "Installed tires and brake shoes.",
      },
      {
        workOrderId: workOrders[7].id,
        userId: users.tech.id,
        startedAt: daysFromNow(-4),
        endedAt: daysFromNow(-4),
        durationMin: 90,
        notes: "Completed steering service.",
      },
    ],
  })

  await prisma.partsReservation.createMany({
    data: [
      {
        workOrderId: workOrders[1].id,
        inventoryItemId: inventoryBySku["KIT-PRO-48V"].id,
        quantity: 1,
        status: "RESERVED",
      },
      {
        workOrderId: workOrders[1].id,
        inventoryItemId: inventoryBySku["CHG-48V-LI"].id,
        quantity: 1,
        status: "RESERVED",
      },
      {
        workOrderId: workOrders[3].id,
        inventoryItemId: inventoryBySku["TIRE-205-50-10"].id,
        quantity: 4,
        status: "CONSUMED",
      },
      {
        workOrderId: workOrders[4].id,
        inventoryItemId: inventoryBySku["SOL-48V"].id,
        quantity: 1,
        status: "RESERVED",
      },
    ],
  })

  const invoiceDefinitions = [
    {
      number: "INV-4001",
      status: InvoiceStatus.PAID,
      customer: customers[3],
      workOrder: workOrders[7],
      issuedAt: daysFromNow(-3),
      dueAt: daysFromNow(11),
      amountPaid: 187.5,
      paymentMethod: PaymentMethod.CARD,
      lines: workOrderDefinitions[7].lines,
    },
    {
      number: "INV-4002",
      status: InvoiceStatus.PARTIALLY_PAID,
      customer: customers[5],
      workOrder: workOrders[3],
      issuedAt: daysFromNow(-1),
      dueAt: daysFromNow(13),
      amountPaid: 400,
      paymentMethod: PaymentMethod.CARD,
      lines: workOrderDefinitions[3].lines,
    },
    {
      number: "INV-4003",
      status: InvoiceStatus.SENT,
      customer: customers[4],
      workOrder: workOrders[5],
      issuedAt: daysFromNow(-1),
      dueAt: daysFromNow(13),
      amountPaid: 0,
      lines: workOrderDefinitions[5].lines,
    },
    {
      number: "INV-4004",
      status: InvoiceStatus.PAID,
      customer: customers[6],
      workOrder: workOrders[0],
      issuedAt: daysFromNow(-2),
      dueAt: daysFromNow(12),
      amountPaid: 179,
      paymentMethod: PaymentMethod.CASH,
      lines: workOrderDefinitions[0].lines,
    },
  ]

  for (const definition of invoiceDefinitions) {
    const totals = calculateTotals(definition.lines)
    const amountDue = roundCurrency(totals.grandTotal - definition.amountPaid)
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: organization.id,
        customerId: definition.customer.id,
        workOrderId: definition.workOrder.id,
        number: definition.number,
        status: definition.status,
        issuedAt: definition.issuedAt,
        dueAt: definition.dueAt,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        amountPaid: definition.amountPaid,
        amountDue,
        notes: "Demo invoice generated by seed script.",
        lineItems: {
          createMany: {
            data: buildLineItemData(
              definition.lines,
              priceBookBySku,
              inventoryBySku,
            ),
          },
        },
      },
    })

    if (definition.amountPaid > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: definition.customer.id,
          amount: definition.amountPaid,
          method: definition.paymentMethod ?? PaymentMethod.CARD,
          reference: `${definition.number}-PAYMENT`,
          notes: "Seeded demo payment.",
          paidAt: definition.issuedAt,
        },
      })
    }
  }

  await prisma.dispatch.createMany({
    data: [
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[9].id,
        addressId: customers[0].addresses[0].id,
        driverId: users.pickup.id,
        vehicleId: vehicles[0].id,
        type: DispatchType.PICKUP,
        status: DispatchStatus.ASSIGNED,
        scheduledAt: daysFromNow(0),
        windowStart: daysFromNow(0),
        windowEnd: daysFromNow(0),
        routeOrder: 1,
        etaMinutes: 35,
        customerNotified: true,
        notes: "Fleet cart pickup for intake inspection.",
      },
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[4].id,
        addressId: customers[2].addresses[0].id,
        driverId: users.pickup.id,
        vehicleId: vehicles[0].id,
        type: DispatchType.PICKUP,
        status: DispatchStatus.COMPLETED,
        scheduledAt: daysFromNow(-3),
        windowStart: daysFromNow(-3),
        windowEnd: daysFromNow(-3),
        routeOrder: 1,
        customerNotified: true,
        completedAt: daysFromNow(-3),
      },
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[3].id,
        addressId: customers[5].addresses[0].id,
        driverId: users.pickup.id,
        vehicleId: vehicles[1].id,
        type: DispatchType.PICKUP,
        status: DispatchStatus.COMPLETED,
        scheduledAt: daysFromNow(-4),
        windowStart: daysFromNow(-4),
        windowEnd: daysFromNow(-4),
        routeOrder: 2,
        customerNotified: true,
        completedAt: daysFromNow(-4),
      },
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[8].id,
        addressId: customers[2].addresses[0].id,
        driverId: users.delivery.id,
        vehicleId: vehicles[1].id,
        type: DispatchType.DELIVERY,
        status: DispatchStatus.SCHEDULED,
        scheduledAt: daysFromNow(1),
        windowStart: daysFromNow(1),
        windowEnd: daysFromNow(1),
        routeOrder: 1,
        etaMinutes: 45,
        customerNotified: true,
      },
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[5].id,
        addressId: customers[4].addresses[0].id,
        driverId: users.delivery.id,
        vehicleId: vehicles[0].id,
        type: DispatchType.DELIVERY,
        status: DispatchStatus.ASSIGNED,
        scheduledAt: daysFromNow(2),
        windowStart: daysFromNow(2),
        windowEnd: daysFromNow(2),
        routeOrder: 2,
        etaMinutes: 30,
        customerNotified: false,
      },
      {
        organizationId: organization.id,
        locationId: location.id,
        workOrderId: workOrders[7].id,
        addressId: customers[3].addresses[0].id,
        driverId: users.delivery.id,
        vehicleId: vehicles[1].id,
        type: DispatchType.DELIVERY,
        status: DispatchStatus.COMPLETED,
        scheduledAt: daysFromNow(-2),
        windowStart: daysFromNow(-2),
        windowEnd: daysFromNow(-2),
        routeOrder: 1,
        customerNotified: true,
        completedAt: daysFromNow(-2),
      },
    ],
  })

  await prisma.lead.createMany({
    data: [
      {
        organizationId: organization.id,
        customerId: customers[7].id,
        title: "Campus 72V lithium conversion",
        status: LeadStatus.QUALIFIED,
        source: "Trade Show",
        value: 7495,
        notes: "Fleet coordinator wants first conversion complete this month.",
        assignedToId: users.advisor.id,
        position: 1,
      },
      {
        organizationId: organization.id,
        customerId: customers[3].id,
        title: "Stone Creek 36V lithium upgrade",
        status: LeadStatus.ESTIMATE_SENT,
        source: "Repeat Customer",
        value: 4695,
        notes: "Estimate sent; follow up tomorrow.",
        assignedToId: users.manager.id,
        position: 2,
      },
      {
        organizationId: organization.id,
        title: "Vacation rental fleet maintenance",
        status: LeadStatus.NEW,
        source: "Website",
        value: 2400,
        notes: "Needs six-cart inspection quote.",
        assignedToId: users.advisor.id,
        position: 3,
      },
      {
        organizationId: organization.id,
        customerId: customers[1].id,
        title: "Northlake 48V conversion",
        status: LeadStatus.WON,
        source: "Website",
        value: 5903.61,
        notes: "Won and converted to WO-1002.",
        assignedToId: users.manager.id,
        position: 4,
      },
      {
        organizationId: organization.id,
        title: "Southshore pickup request",
        status: LeadStatus.CONTACTED,
        source: "Phone",
        value: 179,
        notes: "Needs flat-fee pickup quote before booking.",
        assignedToId: users.dispatch.id,
        position: 5,
      },
    ],
  })

  await prisma.communication.createMany({
    data: [
      {
        organizationId: organization.id,
        customerId: customers[1].id,
        senderId: users.manager.id,
        channel: MessageChannel.EMAIL,
        direction: "OUTBOUND",
        subject: "Estimate approved - WO-1002 scheduled",
        body: "Thanks for approving the Professional 48V Lithium Kit conversion. Your cart is in the shop queue.",
        status: "SENT",
        metadata: { estimateId: estimates[0].id, workOrderId: workOrders[1].id },
      },
      {
        organizationId: organization.id,
        customerId: customers[5].id,
        senderId: users.advisor.id,
        channel: MessageChannel.SMS,
        direction: "OUTBOUND",
        body: "Your tire and brake service is in final quality check. We will send pickup details shortly.",
        status: "SENT",
        metadata: { workOrderId: workOrders[3].id },
      },
      {
        organizationId: organization.id,
        customerId: customers[4].id,
        senderId: users.advisor.id,
        channel: MessageChannel.SMS,
        direction: "OUTBOUND",
        body: "Your charger replacement is complete and ready for pickup at the Covington shop.",
        status: "SENT",
        metadata: { invoice: "INV-4003" },
      },
      {
        organizationId: organization.id,
        customerId: customers[0].id,
        senderId: users.dispatch.id,
        channel: MessageChannel.SMS,
        direction: "OUTBOUND",
        body: "Your pickup window is confirmed. Our driver will notify you when en route.",
        status: "SENT",
        metadata: { routeOrder: 1 },
      },
      {
        organizationId: organization.id,
        customerId: customers[6].id,
        channel: MessageChannel.NOTE,
        direction: "INBOUND",
        body: "Customer noted power loss occurs after uphill drive.",
        status: "LOGGED",
        metadata: { workOrderId: workOrders[0].id },
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: users.manager.id,
        title: "Estimate approved",
        body: "EST-2001 was approved and converted to WO-1002.",
        href: `/work-orders/${workOrders[1].id}`,
      },
      {
        organizationId: organization.id,
        userId: users.tech.id,
        title: "Lithium install checklist pending",
        body: "WO-1002 needs BMS verification and warranty registration.",
        href: `/shop-floor/${workOrders[1].id}`,
      },
      {
        organizationId: organization.id,
        userId: users.dispatch.id,
        title: "Pickup assigned",
        body: "Beau Chene HOA pickup is assigned for today.",
        href: "/dispatch",
      },
      {
        organizationId: organization.id,
        userId: users.accounting.id,
        title: "Partial payment received",
        body: "INV-4002 has a remaining balance after partial payment.",
        href: "/invoices",
      },
    ],
  })

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorId: users.owner.id,
      action: "DEMO_SEED_CREATED",
      entityType: "Organization",
      entityId: organization.id,
      after: {
        taxRateId: taxRate.id,
        servicePlanId: servicePlan.id,
        users: demoUsers.length,
        workOrders: workOrders.length,
      },
    },
  })

  console.log("Seeded NGC Enterprise demo data")
  console.log(`Organization: ${organization.name} (${organization.slug})`)
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
