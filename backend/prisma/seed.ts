import { PrismaClient, PartType } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  'Batteries',
  'Chargers',
  'Controllers',
  'Motors',
  'Tires & Wheels',
  'Seats & Bodies',
  'Electrical',
  'Brakes & Suspension',
  'Accessories',
  'Shop Supplies',
]

const sampleParts: {
  sku: string
  name: string
  category: string
  partType: PartType
  cost: number
  sellPrice?: number
  reorderPoint: number
  reorderQty: number
  barcode?: string
  isCore?: boolean
  coreCharge?: number
  brand?: string
}[] = [
  { sku: 'BAT-48V-105AH', name: '48V 105Ah Lithium Battery Pack', category: 'Batteries', partType: 'INVENTORY', cost: 1899, sellPrice: 2499, reorderPoint: 2, reorderQty: 4, barcode: '8500123456001', brand: 'Relion' },
  { sku: 'BAT-48V-AGM', name: '48V AGM Battery Set (6x8V)', category: 'Batteries', partType: 'INVENTORY', cost: 649, sellPrice: 899, reorderPoint: 3, reorderQty: 6, barcode: '8500123456002', brand: 'Trojan' },
  { sku: 'CHG-48V-15A', name: '48V 15A Automatic Charger', category: 'Chargers', partType: 'INVENTORY', cost: 189, sellPrice: 279, reorderPoint: 4, reorderQty: 8, barcode: '8500123456003', brand: 'Lester' },
  { sku: 'CHG-36V-20A', name: '36V 20A Charger', category: 'Chargers', partType: 'INVENTORY', cost: 165, sellPrice: 249, reorderPoint: 3, reorderQty: 6, barcode: '8500123456004' },
  { sku: 'CTL-500A', name: '500A Controller', category: 'Controllers', partType: 'INVENTORY', cost: 425, sellPrice: 625, reorderPoint: 2, reorderQty: 4, barcode: '8500123456005', brand: 'Curtis' },
  { sku: 'CTL-350A', name: '350A Controller', category: 'Controllers', partType: 'INVENTORY', cost: 310, sellPrice: 475, reorderPoint: 2, reorderQty: 4, barcode: '8500123456006' },
  { sku: 'MOT-5HP-AC', name: '5HP AC Motor', category: 'Motors', partType: 'INVENTORY', cost: 580, sellPrice: 850, reorderPoint: 1, reorderQty: 2, barcode: '8500123456007', isCore: true, coreCharge: 150 },
  { sku: 'MOT-3HP-DC', name: '3HP DC Motor', category: 'Motors', partType: 'INVENTORY', cost: 395, sellPrice: 575, reorderPoint: 2, reorderQty: 3, barcode: '8500123456008', isCore: true, coreCharge: 100 },
  { sku: 'TIR-18X8.5-8', name: '18x8.5-8 Turf Tire', category: 'Tires & Wheels', partType: 'INVENTORY', cost: 42, sellPrice: 69, reorderPoint: 8, reorderQty: 16, barcode: '8500123456009' },
  { sku: 'TIR-18X8.5-8-AS', name: '18x8.5-8 All-Terrain Tire', category: 'Tires & Wheels', partType: 'INVENTORY', cost: 48, sellPrice: 79, reorderPoint: 8, reorderQty: 16, barcode: '8500123456010' },
  { sku: 'WHL-8IN-CHR', name: '8" Chrome Wheel', category: 'Tires & Wheels', partType: 'INVENTORY', cost: 65, sellPrice: 99, reorderPoint: 4, reorderQty: 8, barcode: '8500123456011' },
  { sku: 'SEA-BENCH-TAN', name: 'Bench Seat - Tan', category: 'Seats & Bodies', partType: 'INVENTORY', cost: 185, sellPrice: 295, reorderPoint: 2, reorderQty: 4, barcode: '8500123456012' },
  { sku: 'SEA-BACK-TAN', name: 'Rear Seat Kit - Tan', category: 'Seats & Bodies', partType: 'INVENTORY', cost: 220, sellPrice: 349, reorderPoint: 2, reorderQty: 4, barcode: '8500123456013' },
  { sku: 'ELC-HEAD-LED', name: 'LED Headlight Kit', category: 'Electrical', partType: 'INVENTORY', cost: 38, sellPrice: 65, reorderPoint: 6, reorderQty: 12, barcode: '8500123456014' },
  { sku: 'ELC-TAIL-LED', name: 'LED Taillight Kit', category: 'Electrical', partType: 'INVENTORY', cost: 32, sellPrice: 55, reorderPoint: 6, reorderQty: 12, barcode: '8500123456015' },
  { sku: 'ELC-HRN-12V', name: '12V Horn', category: 'Electrical', partType: 'INVENTORY', cost: 12, sellPrice: 24, reorderPoint: 10, reorderQty: 20, barcode: '8500123456016' },
  { sku: 'BRK-SHOE-SET', name: 'Brake Shoe Set', category: 'Brakes & Suspension', partType: 'INVENTORY', cost: 28, sellPrice: 49, reorderPoint: 6, reorderQty: 12, barcode: '8500123456017' },
  { sku: 'BRK-CBL-FR', name: 'Front Brake Cable', category: 'Brakes & Suspension', partType: 'INVENTORY', cost: 14, sellPrice: 28, reorderPoint: 8, reorderQty: 16, barcode: '8500123456018' },
  { sku: 'ACC-MIR-PAIR', name: 'Side Mirror Pair', category: 'Accessories', partType: 'INVENTORY', cost: 22, sellPrice: 42, reorderPoint: 4, reorderQty: 8, barcode: '8500123456019' },
  { sku: 'ACC-CUP-HLD', name: 'Cup Holder', category: 'Accessories', partType: 'INVENTORY', cost: 8, sellPrice: 18, reorderPoint: 10, reorderQty: 20, barcode: '8500123456020' },
  { sku: 'SUP-WIRE-14G', name: '14ga Wire (per ft)', category: 'Shop Supplies', partType: 'NON_INVENTORY', cost: 0.35, reorderPoint: 0, reorderQty: 0, barcode: '8500123456021' },
  { sku: 'SUP-CONN-PK', name: 'Battery Connector Pack', category: 'Shop Supplies', partType: 'NON_INVENTORY', cost: 4.50, sellPrice: 9, reorderPoint: 20, reorderQty: 50, barcode: '8500123456022' },
  { sku: 'SUP-DIEL-GREASE', name: 'Dielectric Grease', category: 'Shop Supplies', partType: 'NON_INVENTORY', cost: 6, sellPrice: 12, reorderPoint: 5, reorderQty: 10, barcode: '8500123456023' },
  { sku: 'SUP-SHOP-RAG', name: 'Shop Rags (box)', category: 'Shop Supplies', partType: 'NON_INVENTORY', cost: 18, reorderPoint: 3, reorderQty: 6, barcode: '8500123456024' },
  { sku: 'ACC-LIFT-KIT-4', name: '4" Lift Kit', category: 'Accessories', partType: 'INVENTORY', cost: 145, sellPrice: 229, reorderPoint: 2, reorderQty: 4, barcode: '8500123456025' },
  { sku: 'ELC-FWD-REV-SW', name: 'F&R Switch Assembly', category: 'Electrical', partType: 'INVENTORY', cost: 45, sellPrice: 79, reorderPoint: 4, reorderQty: 8, barcode: '8500123456026' },
  { sku: 'CTL-SOL-48V', name: '48V Solenoid', category: 'Controllers', partType: 'INVENTORY', cost: 35, sellPrice: 59, reorderPoint: 6, reorderQty: 12, barcode: '8500123456027' },
  { sku: 'BAT-WATER-KIT', name: 'Battery Watering Kit', category: 'Batteries', partType: 'INVENTORY', cost: 89, sellPrice: 139, reorderPoint: 2, reorderQty: 4, barcode: '8500123456028' },
  { sku: 'TIR-23X10.5-12', name: '23x10.5-12 AT Tire', category: 'Tires & Wheels', partType: 'INVENTORY', cost: 72, sellPrice: 115, reorderPoint: 4, reorderQty: 8, barcode: '8500123456029' },
  { sku: 'SEA-FNR-HNDL', name: 'FNR Handle Assembly', category: 'Seats & Bodies', partType: 'INVENTORY', cost: 28, sellPrice: 49, reorderPoint: 4, reorderQty: 8, barcode: '8500123456030' },
]

async function main() {
  console.log('Seeding database...')

  await prisma.stockMovement.deleteMany()
  await prisma.inventoryLevel.deleteMany()
  await prisma.workOrderLine.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.retailSaleLine.deleteMany()
  await prisma.retailSale.deleteMany()
  await prisma.pOLine.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.coreReturn.deleteMany()
  await prisma.part.deleteMany()
  await prisma.partCategory.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.location.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.alertSetting.deleteMany()

  const loc1 = await prisma.location.create({
    data: { name: 'Main Shop', code: 'MAIN', address: '1200 Fairway Dr, Augusta, GA' },
  })
  const loc2 = await prisma.location.create({
    data: { name: 'South Bay', code: 'SOUTH', address: '450 Cart Path Ln, Martinez, GA' },
  })

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Trojan Battery Company', email: 'orders@trojan.com', phone: '800-423-6569', terms: 'Net 30' } }),
    prisma.vendor.create({ data: { name: 'Curtis Instruments', email: 'sales@curtis.com', phone: '800-288-1112', terms: 'Net 30' } }),
    prisma.vendor.create({ data: { name: 'Madjax Golf Cart Parts', email: 'wholesale@madjax.com', phone: '800-555-0142', terms: 'Net 15' } }),
    prisma.vendor.create({ data: { name: 'Nivel Parts', email: 'orders@nivel.com', phone: '800-555-0198', terms: 'Net 30' } }),
  ])

  const catMap: Record<string, string> = {}
  for (const name of categories) {
    const cat = await prisma.partCategory.create({ data: { name } })
    catMap[name] = cat.id
  }

  for (const p of sampleParts) {
    const part = await prisma.part.create({
      data: {
        sku: p.sku,
        name: p.name,
        categoryId: catMap[p.category],
        partType: p.partType,
        costLast: p.cost,
        costAverage: p.cost,
        sellPrice: p.sellPrice,
        reorderPoint: p.reorderPoint,
        reorderQty: p.reorderQty,
        barcode: p.barcode,
        isCore: p.isCore ?? false,
        coreCharge: p.coreCharge,
        brand: p.brand,
        primaryVendorId: vendors[Math.floor(Math.random() * vendors.length)].id,
      },
    })

    const qty1 = Math.floor(Math.random() * 20) + (p.reorderPoint > 0 ? 0 : 5)
    const qty2 = Math.floor(Math.random() * 15) + (p.reorderPoint > 0 ? 0 : 3)

    await prisma.inventoryLevel.create({
      data: { partId: part.id, locationId: loc1.id, quantity: qty1, binLocation: `A${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 4) + 1}` },
    })
    await prisma.inventoryLevel.create({
      data: { partId: part.id, locationId: loc2.id, quantity: qty2, binLocation: `B${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 4) + 1}` },
    })
  }

  const customer = await prisma.customer.create({
    data: { name: 'Pinehurst Country Club', email: 'fleet@pinehurstcc.com', phone: '706-555-0100' },
  })

  await prisma.workOrder.create({
    data: {
      number: 'WO-00001',
      customerId: customer.id,
      cartMake: 'Club Car',
      cartModel: 'Precedent',
      cartSerial: 'PQ1234567',
      description: 'Battery replacement + charger check',
      status: 'IN_PROGRESS',
      technician: 'Mike T.',
    },
  })

  await prisma.purchaseOrder.create({
    data: {
      number: 'PO-00001',
      vendorId: vendors[0].id,
      status: 'SENT',
      lines: {
        create: [
          { partId: (await prisma.part.findFirst({ where: { sku: 'BAT-48V-AGM' } }))!.id, quantity: 6, unitCost: 649 },
          { partId: (await prisma.part.findFirst({ where: { sku: 'BAT-WATER-KIT' } }))!.id, quantity: 4, unitCost: 89 },
        ],
      },
    },
  })

  await prisma.alertSetting.createMany({
    data: [
      { channel: 'EMAIL', recipient: 'shop@greenlinegolf.com', enabled: true },
      { channel: 'SMS', recipient: '+17065550100', enabled: true },
    ],
  })

  console.log('Seed complete: 2 locations, 4 vendors, 30 parts')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
