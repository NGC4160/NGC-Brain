import { useState, type FormEvent } from 'react'
import { appConfig } from '@/config/app.config'
import { ROLE_LABELS } from '@/config/staff'
import { useAuthContext } from '@/context/AuthContext'

export function LoginPage() {
  const { signIn, authError, clearAuthError, staff } = useAuthContext()
  const [passcode, setPasscode] = useState('')

  const activePeople = staff.filter(
    (s) => s.active && s.passcode && (s.role !== 'technician' || s.name.trim()),
  )

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    clearAuthError()
    signIn(passcode)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-ngc-50 via-white to-brand-50 dark:from-slate-950 dark:via-slate-950 dark:to-ngc-950">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <img
          src={appConfig.logoSrc}
          alt={appConfig.businessName}
          className="mx-auto h-16 w-auto object-contain"
        />
        <h1 className="mt-6 text-center text-2xl font-bold text-ngc-800 dark:text-white">
          Shop sign-in
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter your passcode to open the areas for your role.
        </p>

        <form onSubmit={onSubmit} className="card mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="passcode">
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              maxLength={6}
              className="input-field text-center text-2xl tracking-[0.4em]"
              value={passcode}
              onChange={(e) => {
                clearAuthError()
                setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              placeholder="••••"
              autoFocus
            />
          </div>
          {authError && (
            <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={passcode.length < 4}>
            Sign in
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-ngc-200 bg-white/70 p-4 text-sm dark:border-ngc-800 dark:bg-slate-900/60">
          <p className="font-medium text-ngc-700 dark:text-ngc-200">Who can sign in</p>
          <ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">
            {activePeople.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span>{s.name}</span>
                <span className="text-xs text-slate-400">{ROLE_LABELS[s.role]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Ryan and Christine have the full SOP library. Technicians see assigned work and QC.
            Roy (driver) has route SOPs and the board. Passcodes can be changed in Settings after
            sign-in.
          </p>
        </div>
      </div>
    </div>
  )
}
