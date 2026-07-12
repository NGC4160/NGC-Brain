/** Customer Intake SOP — Neighborhood Golf Carts */

export const DIAGNOSTIC_QUOTE = 179
export const PICKUP_FEE_OUTSIDE = 99
export const FREE_RADIUS_MILES = 40

export const INITIAL_RESPONSE_TEXT =
  "Hi, this is with Neighborhood Golf Carts. We've just received your request about your golf cart. Do you have time for a quick call so we can get you an accurate estimate?"

export const FOLLOW_UP_TEXT =
  'Just checking back on your request. Still a good time to chat?'

export const DIAGNOSTIC_TERMS_TEXT = `Neighborhood Golf Carts — Diagnostic Terms

Diagnostic fee: $${DIAGNOSTIC_QUOTE} plus tax.
This covers inspection and diagnosis of the concern you described. Parts and repair labor are separate and quoted after diagnosis for your approval.

Pickup & delivery:
• Free inside ${FREE_RADIUS_MILES} miles of our North Shore shop, or anywhere on the South Shore of Lake Pontchartrain.
• $${PICKUP_FEE_OUTSIDE} pickup & delivery fee outside that area.

Reply YES to approve these diagnostic terms and we will add you to the waitlist for scheduling.`

export type IntakeLeadSource =
  | 'web-form'
  | 'text'
  | 'phone'
  | 'walk-in'
  | 'referral'
  | 'other'

export type IntakeRequestType = 'diagnostic' | 'estimate'

export type IntakeStage =
  | 'new'
  | 'awaiting-reply'
  | 'follow-up-sent'
  | 'closed-no-response'
  | 'on-call'
  | 'collecting-info'
  | 'awaiting-photos'
  | 'awaiting-diagnostic-terms'
  | 'waitlist'
  | 'estimate-queue'
  | 'converted'

export const INTAKE_STAGE_LABELS: Record<IntakeStage, string> = {
  new: 'New lead — send first text',
  'awaiting-reply': 'Awaiting reply',
  'follow-up-sent': 'Follow-up sent',
  'closed-no-response': 'Closed — no response',
  'on-call': 'On the phone',
  'collecting-info': 'Collecting info',
  'awaiting-photos': 'Awaiting photos',
  'awaiting-diagnostic-terms': 'Awaiting diagnostic terms',
  waitlist: 'Waitlist (SM schedule)',
  'estimate-queue': 'Estimate queue',
  converted: 'Converted to job',
}

export type PickupZone = 'free-north-shore' | 'free-south-shore' | 'paid-outside' | 'unknown'

export const PICKUP_ZONE_LABELS: Record<PickupZone, string> = {
  'free-north-shore': `Free — within ${FREE_RADIUS_MILES} mi of North Shore shop`,
  'free-south-shore': 'Free — South Shore of Lake Pontchartrain',
  'paid-outside': `$${PICKUP_FEE_OUTSIDE} pickup & delivery fee`,
  unknown: 'Zone not yet determined',
}

export interface IntakePhotoChecklist {
  frontOfCart: boolean
  batteryCompartment: boolean
  dashboard: boolean
  dataTags: boolean
  repairArea: boolean
  inspiration: boolean
  notes: string
}

export interface IntakeLead {
  id: string
  createdAt: string
  updatedAt: string
  stage: IntakeStage
  source: IntakeLeadSource
  requestType: IntakeRequestType
  /** Step 1 */
  initialTextSentAt?: string
  /** Step 2 */
  followUpDueAt?: string
  followUpSentAt?: string
  outreachStoppedAt?: string
  /** Contact */
  customerName: string
  phone: string
  email?: string
  /** Step 3–4 */
  problemSummary: string
  symptomsOrScope: string
  locationText?: string
  pickupZone: PickupZone
  diagnosticQuoted: boolean
  /** Cart */
  make?: string
  model?: string
  year?: number
  serialVin?: string
  /** Step 5 */
  photos: IntakePhotoChecklist
  photoLinks?: string
  /** Step 6 */
  notes: string
  diagnosticTermsSentAt?: string
  diagnosticTermsApprovedAt?: string
  estimateOwner: 'office' | 'service-manager' | 'unset'
  linkedJobId?: string
  createdBy: string
  assignedOffice?: string
}

export function emptyPhotoChecklist(_requestType?: IntakeRequestType): IntakePhotoChecklist {
  return {
    frontOfCart: false,
    batteryCompartment: false,
    dashboard: false,
    dataTags: false,
    repairArea: false,
    inspiration: false,
    notes: '',
  }
}

export function requiredPhotos(requestType: IntakeRequestType): {
  key: keyof IntakePhotoChecklist
  label: string
  required: boolean
}[] {
  if (requestType === 'diagnostic') {
    return [
      { key: 'frontOfCart', label: 'Front of the cart', required: true },
      { key: 'batteryCompartment', label: 'Whole battery compartment', required: true },
      { key: 'dashboard', label: 'Whole dashboard', required: true },
      { key: 'dataTags', label: 'Any data tags', required: true },
    ]
  }
  return [
    { key: 'frontOfCart', label: 'Front of the cart', required: true },
    { key: 'batteryCompartment', label: 'Whole battery compartment', required: true },
    { key: 'dataTags', label: 'Any data tags', required: true },
    {
      key: 'repairArea',
      label: 'Specific pictures of the area/part being repaired or upgraded',
      required: true,
    },
    {
      key: 'inspiration',
      label: 'Inspiration pictures (lifted tires / cosmetic upgrades)',
      required: false,
    },
  ]
}

export function photosComplete(lead: IntakeLead): boolean {
  return requiredPhotos(lead.requestType)
    .filter((p) => p.required)
    .every((p) => Boolean(lead.photos[p.key]))
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function isFollowUpDue(lead: IntakeLead, now = new Date()): boolean {
  if (lead.stage !== 'awaiting-reply' || !lead.followUpDueAt) return false
  return now.getTime() >= new Date(lead.followUpDueAt).getTime()
}
