'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { formatCompact } from '@viralytics/core'

type Formatter = (n: number) => string

/**
 * Count-up number that animates from 0 → value the first time it scrolls into
 * view. Defaults to compact formatting (1.2K, 4.5M); pass `format` to override.
 */
export function AnimatedNumber({
  value,
  format = formatCompact,
  duration = 1.1,
  className,
}: {
  value: number
  format?: Formatter
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {format(inView ? display : 0)}
    </span>
  )
}
