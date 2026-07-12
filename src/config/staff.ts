import type { UserRole } from '@/types'

export type StaffRole = Extract<
  UserRole,
  'owner' | 'service-manager' | 'technician' | 'front-desk' | 'driver'
>

export interface StaffMember {
  id: string
  /** Name shown in UI and matched to job.assignedTech */
  name: string
  role: StaffRole
  /** 4–6 digit shop PIN — changeable in Settings */
  passcode: string
  /** Technicians only: slot 1–5. Inactive/empty slots are hidden. */
  techSlot?: 1 | 2 | 3 | 4 | 5
  active: boolean
}

export const MAX_TECHNICIANS = 5

/** Default shop roster (Neighborhood Golf Carts). Passcodes are shop-floor PINs, not internet passwords. */
export const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'sm-ryan',
    name: 'Ryan White',
    role: 'service-manager',
    passcode: '2468',
    active: true,
  },
  {
    id: 'office-christine',
    name: 'Christine White',
    role: 'front-desk',
    passcode: '1357',
    active: true,
  },
  {
    id: 'owner-ngc',
    name: 'Owner',
    role: 'owner',
    passcode: '0416',
    active: true,
  },
  {
    id: 'driver-roy',
    name: 'Roy',
    role: 'driver',
    passcode: '4444',
    active: true,
  },
  {
    id: 'tech-1',
    name: 'Taylor',
    role: 'technician',
    passcode: '1111',
    techSlot: 1,
    active: true,
  },
  {
    id: 'tech-2',
    name: 'Marlon',
    role: 'technician',
    passcode: '2222',
    techSlot: 2,
    active: true,
  },
  {
    id: 'tech-3',
    name: 'Peyton',
    role: 'technician',
    passcode: '3333',
    techSlot: 3,
    active: true,
  },
  {
    id: 'tech-4',
    name: '',
    role: 'technician',
    passcode: '',
    techSlot: 4,
    active: false,
  },
  {
    id: 'tech-5',
    name: '',
    role: 'technician',
    passcode: '',
    techSlot: 5,
    active: false,
  },
]

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  'service-manager': 'Service manager',
  technician: 'Technician',
  'front-desk': 'Office',
  driver: 'Driver',
}

/** Roles that can open the full SOP library any time (Ryan, Christine, Owner) */
export const SOP_LIBRARY_ROLES: StaffRole[] = ['owner', 'service-manager', 'front-desk']

/** Modules each role can open */
export const ROLE_MODULES: Record<StaffRole, string[]> = {
  owner: [
    'dashboard',
    'intake',
    'sops',
    'board',
    'jobs',
    'agent-input',
    'qc',
    'resources',
    'invoicing',
    'settings',
  ],
  'service-manager': [
    'dashboard',
    'intake',
    'sops',
    'board',
    'jobs',
    'agent-input',
    'qc',
    'resources',
    'invoicing',
    'settings',
  ],
  technician: ['dashboard', 'board', 'jobs', 'agent-input', 'qc', 'sops', 'resources'],
  'front-desk': [
    'dashboard',
    'intake',
    'sops',
    'board',
    'jobs',
    'agent-input',
    'resources',
    'invoicing',
  ],
  driver: ['dashboard', 'sops', 'board', 'resources'],
}

export function canAssignJobs(role: StaffRole): boolean {
  return role === 'owner' || role === 'service-manager'
}

export function canManageStaff(role: StaffRole): boolean {
  return role === 'owner' || role === 'service-manager'
}

export function canOverrideDeposit(role: StaffRole): boolean {
  return role === 'owner' || role === 'service-manager'
}

export function canAccessModule(role: StaffRole, moduleId: string): boolean {
  return ROLE_MODULES[role]?.includes(moduleId) ?? false
}

export function hasFullSopLibrary(role: StaffRole | null): boolean {
  return role != null && SOP_LIBRARY_ROLES.includes(role)
}

/** Technician display names used for assignment dropdowns */
export function activeTechnicianNames(staff: StaffMember[]): string[] {
  return staff
    .filter((s) => s.role === 'technician' && s.active && s.name.trim())
    .sort((a, b) => (a.techSlot ?? 99) - (b.techSlot ?? 99))
    .map((s) => s.name.trim())
}
