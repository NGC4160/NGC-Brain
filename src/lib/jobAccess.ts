import type { RepairJob } from '@/types'
import type { AuthSession } from '@/hooks/useAuth'

/** Filter jobs for the signed-in role. Technicians only see carts assigned to them. */
export function filterJobsForSession(
  jobs: RepairJob[],
  session: AuthSession | null,
): RepairJob[] {
  if (!session) return []
  if (session.role !== 'technician') return jobs
  const name = session.name.trim().toLowerCase()
  return jobs.filter((j) => (j.assignedTech ?? '').trim().toLowerCase() === name)
}

export function isJobAssignedTo(
  job: RepairJob,
  session: AuthSession | null,
): boolean {
  if (!session) return false
  if (session.role !== 'technician') return true
  return (job.assignedTech ?? '').trim().toLowerCase() === session.name.trim().toLowerCase()
}
