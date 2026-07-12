import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_STAFF,
  type StaffMember,
  type StaffRole,
  canAccessModule,
  canAssignJobs,
  canManageStaff,
  canOverrideDeposit,
  activeTechnicianNames,
} from '@/config/staff'

const STAFF_KEY = 'ngc-staff-roster-v1'
const SESSION_KEY = 'ngc-auth-session-v1'

export interface AuthSession {
  staffId: string
  name: string
  role: StaffRole
  signedInAt: string
}

function loadStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_KEY)
    if (!raw) return DEFAULT_STAFF.map((s) => ({ ...s }))
    const parsed = JSON.parse(raw) as StaffMember[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_STAFF.map((s) => ({ ...s }))
    }
    // Ensure all default ids exist (merge by id)
    const byId = new Map(parsed.map((s) => [s.id, s]))
    return DEFAULT_STAFF.map((def) => {
      const existing = byId.get(def.id)
      return existing ? { ...def, ...existing, id: def.id, role: def.role, techSlot: def.techSlot } : { ...def }
    })
  } catch {
    return DEFAULT_STAFF.map((s) => ({ ...s }))
  }
}

function saveStaff(staff: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff))
}

function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function saveSession(session: AuthSession | null) {
  if (!session) sessionStorage.removeItem(SESSION_KEY)
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function useAuth() {
  const [staff, setStaff] = useState<StaffMember[]>(loadStaff)
  const [session, setSession] = useState<AuthSession | null>(loadSession)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    saveStaff(staff)
  }, [staff])

  const signIn = useCallback(
    (passcode: string) => {
      setAuthError(null)
      const pin = passcode.trim()
      if (!/^\d{4,6}$/.test(pin)) {
        setAuthError('Enter a 4–6 digit passcode')
        return false
      }
      const match = staff.find(
        (s) => s.active && s.passcode && s.passcode === pin && (s.role !== 'technician' || s.name.trim()),
      )
      if (!match) {
        setAuthError('Incorrect passcode')
        return false
      }
      const next: AuthSession = {
        staffId: match.id,
        name: match.name,
        role: match.role,
        signedInAt: new Date().toISOString(),
      }
      setSession(next)
      saveSession(next)
      return true
    },
    [staff],
  )

  const signOut = useCallback(() => {
    setSession(null)
    saveSession(null)
  }, [])

  const updateStaffMember = useCallback((id: string, patch: Partial<StaffMember>) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...patch }
        if (next.role === 'technician') {
          const name = (next.name ?? '').trim()
          const code = (next.passcode ?? '').trim()
          next.active = Boolean(name && code)
          next.name = name
          next.passcode = code
        }
        return next
      }),
    )
  }, [])

  const resetStaffDefaults = useCallback(() => {
    setStaff(DEFAULT_STAFF.map((s) => ({ ...s })))
  }, [])

  const role = session?.role ?? null
  const techNames = useMemo(() => activeTechnicianNames(staff), [staff])

  return {
    staff,
    session,
    isAuthenticated: Boolean(session),
    authError,
    clearAuthError: () => setAuthError(null),
    signIn,
    signOut,
    updateStaffMember,
    resetStaffDefaults,
    techNames,
    canAssignJobs: role ? canAssignJobs(role) : false,
    canManageStaff: role ? canManageStaff(role) : false,
    canOverrideDeposit: role ? canOverrideDeposit(role) : false,
    canAccessModule: (moduleId: string) => (role ? canAccessModule(role, moduleId) : false),
    isTechnician: role === 'technician',
    isServiceManager: role === 'service-manager',
    isDriver: role === 'driver',
    isOffice: role === 'front-desk' || role === 'service-manager' || role === 'owner',
  }
}

export type AuthStore = ReturnType<typeof useAuth>
