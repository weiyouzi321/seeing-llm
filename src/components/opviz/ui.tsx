'use client'

import type { ReactNode } from 'react'

/**
 * 确定性伪随机 —— 静态导出时客户端组件也会被预渲染，
 * 初始状态若用 Math.random() 会造成 hydration 不一致。
 * 所以「首屏用种子、交互才用真随机」。
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box-Muller：把 [0,1) 均匀数变成标准正态 */
export function gauss(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-9)
  const v = rnd()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="eyebrow">{label}</span>
        {hint != null && (
          <span className="font-mono text-xs text-fg-muted tabular-nums">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
}) {
  return (
    <Field label={label} hint={display ?? String(value)}>
      <input
        type="range"
        className="rng w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </Field>
  )
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 bg-raised border border-line rounded-lg">
      {options.map((o) => {
        const on = o.v === value
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className="px-3 py-1 rounded-md font-mono text-xs transition"
            style={
              on
                ? { color: '#22D3EE', background: 'rgba(34,211,238,0.14)', border: '1px solid rgba(34,211,238,0.4)' }
                : { color: '#5A6B85', border: '1px solid transparent' }
            }
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Stat({
  k,
  v,
  sub,
  color = '#E6EDF7',
}: {
  k: string
  v: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-2.5">
      <div className="eyebrow mb-1">{k}</div>
      <div className="font-mono text-base font-semibold tabular-nums" style={{ color }}>
        {v}
      </div>
      {sub && <div className="text-[11px] text-fg-dim mt-0.5 leading-snug">{sub}</div>}
    </div>
  )
}

export function Btn({
  children,
  onClick,
  ghost,
}: {
  children: ReactNode
  onClick: () => void
  ghost?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg font-mono text-xs transition"
      style={
        ghost
          ? { color: '#8A9BB8', border: '1px solid #1B2740' }
          : { color: '#22D3EE', border: '1px solid rgba(34,211,238,0.4)', background: 'rgba(34,211,238,0.1)' }
      }
    >
      {children}
    </button>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-fg-dim leading-relaxed mt-4 font-mono">{children}</p>
  )
}
