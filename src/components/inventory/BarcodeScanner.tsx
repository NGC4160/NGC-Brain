import { useEffect, useRef, useState, useCallback } from 'react'
import { ScanBarcode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

/**
 * USB keyboard-wedge barcode scanner input.
 * Scanners typically send digits + Enter; we capture rapid input and Enter key.
 */
export function BarcodeScanner({
  onScan,
  placeholder = 'Scan barcode or type SKU...',
  autoFocus = true,
  className,
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const bufferRef = useRef('')
  const lastKeyTime = useRef(0)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const submit = useCallback((code: string) => {
    const trimmed = code.trim()
    if (trimmed) {
      onScan(trimmed)
      setValue('')
      bufferRef.current = ''
    }
  }, [onScan])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now()
    if (now - lastKeyTime.current > 100) {
      bufferRef.current = ''
    }
    lastKeyTime.current = now

    if (e.key === 'Enter') {
      e.preventDefault()
      submit(value || bufferRef.current)
      return
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key
    }
  }

  return (
    <div className={cn('relative', className)}>
      <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field pl-10 font-mono"
        autoComplete="off"
        inputMode="none"
      />
    </div>
  )
}
