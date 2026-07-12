import type { SopDefinition } from '../types'
import {
  DIAGNOSTIC_QUOTE,
  FOLLOW_UP_TEXT,
  INITIAL_RESPONSE_TEXT,
  PICKUP_FEE_OUTSIDE,
} from '@/config/intakeSop'

export const customerIntakeSop: SopDefinition = {
  id: 'customer-intake',
  title: 'Customer Intake SOP',
  shortTitle: 'Intake',
  description:
    'Respond to every lead quickly, gather info & photos, set expectations, and route diagnostics to the waitlist or estimates to the queue.',
  ownerRoles: ['front-desk'],
  accessRoles: ['front-desk', 'service-manager', 'owner'],
  status: 'active',
  runtime: 'module',
  modulePath: '/intake',
  sourceDoc: 'docs/CUSTOMER_INTAKE.md',
  tags: ['intake', 'leads', 'office', 'diagnostics', 'estimates'],
  section: 'office',
  lastVerified: '2026-07-12',
  relatedSopIds: ['repair-intake-checklist', 'pickup-delivery', 'shop-workflow'],
  steps: [
    {
      id: 'initial-response',
      title: 'Step 1 — Initial response',
      summary: 'Immediately text every new lead.',
      scripts: [{ id: 'initial', label: 'Initial text', text: INITIAL_RESPONSE_TEXT }],
    },
    {
      id: 'follow-up',
      title: 'Step 2 — No response follow-up',
      summary: 'Wait 24 hours, send one follow-up, then stop outreach.',
      scripts: [{ id: 'follow-up', label: 'Follow-up text', text: FOLLOW_UP_TEXT }],
    },
    {
      id: 'phone',
      title: 'Step 3 — On the phone',
      summary: `Identify the problem. Quote $${DIAGNOSTIC_QUOTE} + tax for diagnostics. Determine pickup zone.`,
    },
    {
      id: 'info',
      title: 'Step 4 — Information collection',
      summary: 'Collect all required customer/cart fields and detailed symptoms or scope.',
    },
    {
      id: 'photos',
      title: 'Step 5 — Pictures required',
      summary: 'Request diagnostic or estimate photo sets so the Service Manager can estimate accurately.',
    },
    {
      id: 'after-call',
      title: 'Step 6 — After the call',
      summary:
        'Attach photos, add notes, send diagnostic terms (office). Approved diagnostics → waitlist. Estimates → estimate queue.',
    },
  ],
}

export const shopQcSop: SopDefinition = {
  id: 'shop-qc',
  title: 'Shop QC Completion SOP',
  shortTitle: 'QC',
  description:
    'Technicians complete QC after every cart — photos, 7-point safety inspection, test drive, then move to Ready.',
  ownerRoles: ['technician'],
  accessRoles: ['technician', 'service-manager', 'owner', 'front-desk'],
  status: 'active',
  runtime: 'module',
  modulePath: '/qc',
  sourceDoc: 'docs/SHOP_ACCESS.md',
  tags: ['qc', 'technician', 'safety', 'ready'],
  section: 'shop',
  lastVerified: '2026-07-11',
  relatedSopIds: ['shop-workflow', 'job-assignment'],
  steps: [
    {
      id: 'prework',
      title: 'Pre-work',
      summary: 'Review job, verify cart, PPE, tow/run, disconnect, clean bay.',
    },
    {
      id: 'before-photos',
      title: 'Before-work photos (7)',
      summary: 'Front, rear, both sides, battery, dash, serial/VIN.',
    },
    {
      id: 'inspection',
      title: '7-point safety inspection',
      summary: 'Wires, battery, lights/horn, tires, steering, drivetrain, brakes.',
    },
    {
      id: 'quality',
      title: 'Final quality + test drive',
      summary: 'Completeness, neatness, cleanliness, tightness, safety; test drive; certify and move to Ready.',
    },
  ],
}

export const repairIntakeChecklistSop: SopDefinition = {
  id: 'repair-intake-checklist',
  title: 'Repair Intake Checklist',
  shortTitle: 'Repair intake',
  description:
    'Complete before scheduling work — customer/cart confirmed, photos, money & deposit expectations.',
  ownerRoles: ['front-desk', 'service-manager'],
  accessRoles: ['front-desk', 'service-manager', 'owner'],
  status: 'active',
  runtime: 'checklist',
  modulePath: '/sops/repair-intake-checklist',
  sourceDoc: 'docs/intake-checklist.html',
  tags: ['intake', 'checklist', 'scheduling'],
  section: 'office',
  lastVerified: '2026-07-12',
  relatedSopIds: ['customer-intake', 'deposit-gates'],
  steps: [
    {
      id: 'customer-cart',
      title: 'Customer & cart',
      summary: 'Confirm contact, make/model/year, serial/VIN, keys.',
    },
    {
      id: 'photos',
      title: 'Photos & condition',
      summary: 'Full cart photos, damage notes, complaint in customer words.',
    },
    {
      id: 'money',
      title: 'Money & scheduling',
      summary: `Explain $${DIAGNOSTIC_QUOTE} diagnostic, collect deposits when required, record pickup needs.`,
    },
  ],
  checklist: [
    { id: 'contact', label: 'Customer name, phone, and email confirmed', required: true },
    { id: 'mmy', label: 'Make / model / year recorded', required: true },
    { id: 'serial', label: 'Serial / VIN photographed and entered', required: true },
    { id: 'keys', label: 'Key(s) tagged and logged', required: true },
    { id: 'photos', label: 'Front, rear, both sides, and serial plate photos', required: true },
    { id: 'damage', label: 'Existing body damage noted', required: true },
    { id: 'complaint', label: 'Customer complaint written in their words', required: true },
    { id: 'outcome', label: 'Desired outcome / urgency noted', required: true },
    {
      id: 'diagnostic',
      label: `Diagnostic / minimum charge explained ($${DIAGNOSTIC_QUOTE})`,
      required: true,
    },
    {
      id: 'deposit',
      label: 'Deposit collected if batteries / lithium / special-order parts',
      required: true,
    },
    { id: 'pickup', label: 'Pickup / delivery needs recorded', required: true },
    { id: 'signoff', label: 'Customer sign-off obtained', required: true },
  ],
}

export const depositGatesSop: SopDefinition = {
  id: 'deposit-gates',
  title: 'Deposit Gates SOP',
  shortTitle: 'Deposits',
  description:
    'Block parts/bay work until required deposits are collected — lithium $1,800, battery $800, diagnostic $179.',
  ownerRoles: ['service-manager', 'front-desk'],
  accessRoles: ['front-desk', 'service-manager', 'owner'],
  status: 'active',
  runtime: 'policy',
  modulePath: '/jobs',
  tags: ['deposits', 'lithium', 'battery', 'policy'],
  section: 'shared',
  lastVerified: '2026-07-11',
  relatedSopIds: ['customer-intake', 'shop-workflow'],
  steps: [
    {
      id: 'classify',
      title: 'Classify the job',
      summary: 'Lithium / battery / diagnostic / motor-controller / general from the work description.',
    },
    {
      id: 'collect',
      title: 'Collect deposit',
      summary: 'Lithium $1,800 · Battery $800 · Diagnostic $179 · Motor/controller half of total (min $179).',
    },
    {
      id: 'gate',
      title: 'Enforce gate',
      summary: 'Waiting Parts / In Repair blocked when deposit is short (manager override only).',
    },
  ],
}

export const jobAssignmentSop: SopDefinition = {
  id: 'job-assignment',
  title: 'Job Assignment SOP',
  shortTitle: 'Assign jobs',
  description:
    'Service manager assigns carts to technicians. Techs only see and QC jobs assigned to them.',
  ownerRoles: ['service-manager'],
  accessRoles: ['service-manager', 'owner', 'front-desk'],
  status: 'active',
  runtime: 'module',
  modulePath: '/board',
  tags: ['assignment', 'technician', 'board'],
  section: 'shop',
  lastVerified: '2026-07-11',
  relatedSopIds: ['shop-qc', 'shop-workflow'],
  steps: [
    {
      id: 'board',
      title: 'Open Status Board',
      summary: 'Review Received / Diagnosing carts that need a tech.',
    },
    {
      id: 'assign',
      title: 'Assign tech',
      summary: 'Use Assign tech on each card (Taylor, Marlon, Peyton, or slots 4–5).',
    },
    {
      id: 'verify',
      title: 'Verify tech view',
      summary: 'Tech sign-in shows only assigned jobs; QC limited to those carts.',
    },
  ],
}

export const pickupDeliverySop: SopDefinition = {
  id: 'pickup-delivery',
  title: 'Pickup & Delivery Zone SOP',
  shortTitle: 'Pickup zones',
  description: `Free pickup & delivery inside 40 miles of the North Shore shop or anywhere on the South Shore. $${PICKUP_FEE_OUTSIDE} outside that area.`,
  ownerRoles: ['front-desk', 'driver'],
  accessRoles: ['front-desk', 'service-manager', 'owner', 'driver'],
  status: 'active',
  runtime: 'policy',
  modulePath: '/intake',
  tags: ['pickup', 'delivery', 'roy', 'zones'],
  section: 'driver',
  lastVerified: '2026-07-12',
  relatedSopIds: ['customer-intake', 'driver-route', 'shop-workflow'],
  steps: [
    {
      id: 'ask-location',
      title: 'Ask for location',
      summary: 'Get city / address during the intake call.',
    },
    {
      id: 'classify-zone',
      title: 'Classify zone',
      summary: `Free North Shore (≤40 mi) · Free South Shore · Paid outside ($${PICKUP_FEE_OUTSIDE}).`,
    },
    {
      id: 'record',
      title: 'Record on the lead',
      summary: 'Set pickup zone on Customer Intake so scheduling and quotes stay accurate.',
    },
  ],
}

export const driverRouteSop: SopDefinition = {
  id: 'driver-route',
  title: 'Driver Route & Cart Handling SOP',
  shortTitle: 'Driver route',
  description:
    'Roy’s daily pickup/delivery checklist — confirm addresses, secure carts, collect signatures, and sync Out Today with the shop board.',
  ownerRoles: ['driver'],
  accessRoles: ['driver', 'service-manager', 'owner', 'front-desk'],
  status: 'active',
  runtime: 'checklist',
  modulePath: '/sops/driver-route',
  tags: ['driver', 'roy', 'pickup', 'delivery', 'route'],
  section: 'driver',
  lastVerified: '2026-07-12',
  relatedSopIds: ['pickup-delivery', 'shop-whiteboard', 'shop-workflow'],
  steps: [
    {
      id: 'morning',
      title: 'Before leaving the shop',
      summary: 'Pull Out Today list from the board; confirm addresses, keys, and payment notes with office.',
    },
    {
      id: 'on-route',
      title: 'On each stop',
      summary: 'Secure cart, verify customer ID/name, note damage, collect signature or photo proof.',
    },
    {
      id: 'return',
      title: 'Back at the shop',
      summary: 'Drop off pickups in Intake, update statuses, hand paperwork/keys to Christine or Ryan.',
    },
  ],
  checklist: [
    { id: 'board', label: 'Out Today / route list confirmed with Ryan or Christine', required: true },
    { id: 'keys', label: 'Keys tagged and matched to each cart on the truck', required: true },
    { id: 'zones', label: 'Stops ordered by zone (North Shore / South Shore / paid)', required: true },
    { id: 'secure', label: 'Each cart secured before rolling', required: true },
    { id: 'customer', label: 'Customer name / address verified at every stop', required: true },
    { id: 'condition', label: 'Pre-existing damage noted (photo if needed)', required: true },
    { id: 'proof', label: 'Signature or delivery proof captured', required: true },
    { id: 'intake-drop', label: 'Shop pickups placed in Intake lane with notes', required: true },
    { id: 'handoff', label: 'Paperwork / payment notes handed to office', required: true },
  ],
}

export const shopWorkflowSop: SopDefinition = {
  id: 'shop-workflow',
  title: 'Shop Workflow SOP',
  shortTitle: 'Shop flow',
  description:
    'End-to-end shop journey: contact → intake → arrival → repair → QC → payment → pickup/delivery.',
  ownerRoles: ['service-manager'],
  accessRoles: ['front-desk', 'service-manager', 'owner', 'technician', 'driver'],
  status: 'active',
  runtime: 'reference',
  modulePath: '/sops/shop-workflow',
  sourceDoc: 'knowledge/04_operations/shop_workflow.md',
  tags: ['workflow', 'shop', 'overview'],
  section: 'shared',
  lastVerified: '2026-06-28',
  relatedSopIds: [
    'customer-intake',
    'repair-intake-checklist',
    'job-assignment',
    'shop-qc',
    'deposit-gates',
    'pickup-delivery',
    'driver-route',
    'shop-whiteboard',
  ],
  steps: [
    {
      id: 'contact',
      title: 'Customer contact & scheduling',
      summary: 'Office handles phones/intake; hours Mon–Fri 8–5.',
    },
    {
      id: 'arrival',
      title: 'Vehicle arrival',
      summary: 'Customer drop-off or Roy pickup per zone SOP.',
    },
    {
      id: 'service',
      title: 'Service execution',
      summary: 'SM oversees; techs repair; every job includes free 7-point inspection.',
    },
    {
      id: 'deposits',
      title: 'Parts & deposits',
      summary: 'Large-ticket items require deposit before ordering (see Deposit Gates).',
    },
    {
      id: 'complete',
      title: 'QC, payment, delivery',
      summary: 'QC form → Ready → collect payment → customer pickup or Roy delivery.',
    },
  ],
}

export const shopWhiteboardSop: SopDefinition = {
  id: 'shop-whiteboard',
  title: 'Shop Whiteboard Layout SOP',
  shortTitle: 'Whiteboard',
  description:
    'Physical board is floor truth — 7 lanes from Intake through Out Today, WIP caps, and morning huddle finish list.',
  ownerRoles: ['service-manager'],
  accessRoles: ['front-desk', 'service-manager', 'owner', 'technician', 'driver'],
  status: 'active',
  runtime: 'reference',
  modulePath: '/board',
  sourceDoc: 'knowledge/04_operations/shop_whiteboard_layout.md',
  tags: ['whiteboard', 'board', 'wip', 'huddle'],
  section: 'shared',
  lastVerified: '2026-06-28',
  relatedSopIds: ['shop-workflow', 'job-assignment', 'driver-route'],
  steps: [
    {
      id: 'lanes',
      title: 'Seven lanes',
      summary: 'Intake → Diag → Parts → In Repair → QC → Ready → Out Today (Roy).',
    },
    {
      id: 'caps',
      title: 'WIP caps',
      summary: 'Intake max 3 · Diag max 2 · Parts max 4 · QC max 2 · Ready max 4 · shop WIP ~6.',
    },
    {
      id: 'huddle',
      title: '8:15 huddle',
      summary: 'Ryan sets Today’s Finish List (max 4). Update HCP at open, lunch, and close.',
    },
    {
      id: 'digital',
      title: 'Match digital board',
      summary: 'Status Board in the DMS mirrors the wall columns for assignment and QC.',
    },
  ],
}

/** Export order = display order on the SOPs hub */
export const SOP_CATALOG: SopDefinition[] = [
  customerIntakeSop,
  repairIntakeChecklistSop,
  pickupDeliverySop,
  driverRouteSop,
  depositGatesSop,
  jobAssignmentSop,
  shopQcSop,
  shopWorkflowSop,
  shopWhiteboardSop,
]
