import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const PULL_THRESHOLD = 72
const MAX_PULL = 110

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => void | Promise<void>
  refreshing?: boolean
  className?: string
  contentClassName?: string
}

function isScrollableY(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  const overflowY = style.overflowY
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false
  }
  return el.scrollHeight > el.clientHeight + 1
}

/** Nearest vertical scroller between target and the page pull-to-refresh root. */
function nestedScrollParent(target: EventTarget | null, root: HTMLElement): HTMLElement | null {
  if (!(target instanceof Element)) return null
  let node: Element | null = target
  while (node && node !== root) {
    if (isScrollableY(node)) return node as HTMLElement
    node = node.parentElement
  }
  return null
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  className,
  contentClassName,
}: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const armedRef = useRef(false)
  const refreshingRef = useRef(refreshing)
  const onRefreshRef = useRef(onRefresh)
  const [pullDistance, setPullDistance] = useState(0)
  const [armed, setArmed] = useState(false)

  refreshingRef.current = refreshing
  onRefreshRef.current = onRefresh

  const reset = useCallback(() => {
    pulling.current = false
    startY.current = 0
    armedRef.current = false
    setPullDistance(0)
    setArmed(false)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const canStartPull = (e: TouchEvent) => {
      if (refreshingRef.current) return false
      if (el.scrollTop > 0) return false
      const target = e.target
      if (target instanceof Element && target.closest('[data-no-pull-refresh]')) {
        return false
      }
      // Job sheets / nested overflow areas own their own scroll — never steal it
      if (nestedScrollParent(target, el)) return false
      return true
    }

    const onStart = (e: TouchEvent) => {
      if (!canStartPull(e)) {
        pulling.current = false
        return
      }
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return
      if (el.scrollTop > 0) {
        reset()
        return
      }
      // If finger moved into a sheet/nested scroller mid-gesture, abort
      if (e.target instanceof Element && e.target.closest('[data-no-pull-refresh]')) {
        reset()
        return
      }
      if (nestedScrollParent(e.target, el)) {
        reset()
        return
      }

      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        setPullDistance(0)
        armedRef.current = false
        setArmed(false)
        return
      }

      const distance = Math.min(MAX_PULL, delta * 0.45)
      setPullDistance(distance)
      const nextArmed = distance >= PULL_THRESHOLD
      armedRef.current = nextArmed
      setArmed(nextArmed)

      if (distance > 8) e.preventDefault()
    }

    const onEnd = () => {
      if (!pulling.current) return
      const shouldRefresh = armedRef.current && !refreshingRef.current
      reset()
      if (shouldRefresh) void Promise.resolve(onRefreshRef.current())
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [reset])

  const indicatorOffset = refreshing
    ? Math.min(PULL_THRESHOLD, 56)
    : pullDistance
  const showIndicator = indicatorOffset > 6 || refreshing

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{
          transform: `translateY(${Math.max(0, indicatorOffset - 8)}px)`,
          opacity: showIndicator ? Math.min(1, indicatorOffset / PULL_THRESHOLD) : 0,
          transition: pulling.current ? 'none' : 'transform 180ms ease, opacity 180ms ease',
        }}
        aria-hidden={!showIndicator}
      >
        <div
          className={cn(
            'mt-1 flex items-center gap-2 rounded-full border border-ngc-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-ngc-700 shadow-sm dark:border-ngc-700 dark:bg-slate-900/95 dark:text-ngc-200',
            armed && !refreshing && 'border-brand-300 text-brand-700 dark:border-brand-700 dark:text-brand-300',
          )}
        >
          <RefreshCw
            className={cn(
              'h-3.5 w-3.5',
              refreshing && 'animate-spin',
              !refreshing && armed && 'rotate-180',
            )}
          />
          {refreshing ? 'Updating…' : armed ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto overscroll-y-contain', contentClassName)}
      >
        <div
          style={{
            transform: refreshing
              ? `translateY(${Math.min(PULL_THRESHOLD, 56)}px)`
              : pullDistance
                ? `translateY(${pullDistance}px)`
                : undefined,
            transition: pulling.current ? 'none' : 'transform 180ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
