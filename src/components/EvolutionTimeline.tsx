'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  EVOLUTION,
  LANE_META,
  LANE_ORDER,
  EVO_MIN,
  EVO_MAX,
  type Lane,
  type EvoEvent,
} from '@/lib/evolution'

/**
 * A5 · 架构演进时间轴
 *
 * 上：五条线索的泳道缩略图 —— 一眼看出「哪几年在密集发生什么」
 * 下：纵向详细时间轴 —— 每条写清「为什么重要」，能链回站内对应页面
 *
 * 泳道图里同一条线索的事件可能撞在一起（2022 年训练侧就挤了三条），
 * 所以做了个最简单的避让：离前一个点太近就上下错开 6px。
 */

type LaneFilter = Lane | 'all' | 'star'

const FILTERS: { v: LaneFilter; label: string }[] = [
  { v: 'all', label: '全部' },
  { v: 'attn', label: '注意力' },
  { v: 'moe', label: '稀疏化' },
  { v: 'ctx', label: '上下文与精度' },
  { v: 'arch', label: '骨架' },
  { v: 'train', label: '训练与对齐' },
  { v: 'star', label: '与焦点模型直接相关' },
]

/* ------------------------- 泳道缩略图 ------------------------- */

const SW_W = 680
const SW_PAD_L = 62
const SW_PAD_R = 14
const SW_ROW = 30
const SW_TOP = 22

export function EvolutionTimeline() {
  const [filter, setFilter] = useState<LaneFilter>('all')

  const visible = useMemo(() => {
    if (filter === 'all') return EVOLUTION
    if (filter === 'star') return EVOLUTION.filter((e) => e.star)
    return EVOLUTION.filter((e) => e.lane === filter)
  }, [filter])

  /** 泳道里的点（始终用全量，作为全局导航） */
  const dots = useMemo(() => buildDots(EVOLUTION), [])
  const dim = (e: EvoEvent) => filter !== 'all' && filter !== 'star' && e.lane !== filter

  return (
    <div className="space-y-6">
      {/* ---------- 泳道缩略图 ---------- */}
      <div className="panel p-5">
        <div className="eyebrow mb-1">五条线索 · 什么时候在发生什么</div>
        <div className="font-mono text-[11px] text-fg-dim mb-3">
          {EVO_MIN} — {EVO_MAX - 1} · 共 {EVOLUTION.length} 个节点 · 白圈 = 与焦点模型直接相关
        </div>

        <svg
          viewBox={`0 0 ${SW_W} ${SW_TOP + LANE_ORDER.length * SW_ROW + 12}`}
          className="w-full"
          role="img"
          aria-label="架构演进泳道缩略图"
        >
          {/* 年份刻度 */}
          {Array.from({ length: EVO_MAX - EVO_MIN + 1 }, (_, i) => EVO_MIN + i).map((y) => {
            const x = swX(y)
            return (
              <g key={y}>
                <line
                  x1={x}
                  x2={x}
                  y1={SW_TOP - 8}
                  y2={SW_TOP + LANE_ORDER.length * SW_ROW}
                  stroke="#131C2E"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={SW_TOP - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#5A6B85"
                  fontFamily="monospace"
                >
                  {y}
                </text>
              </g>
            )
          })}

          {/* 泳道 */}
          {LANE_ORDER.map((lane, li) => {
            const y = SW_TOP + li * SW_ROW + SW_ROW / 2
            const meta = LANE_META[lane]
            return (
              <g key={lane}>
                <line x1={SW_PAD_L} x2={SW_W - SW_PAD_R} y1={y} y2={y} stroke="#131C2E" strokeWidth="1" />
                <text
                  x={SW_PAD_L - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill={meta.hex}
                  fontFamily="monospace"
                >
                  {meta.label}
                </text>
              </g>
            )
          })}

          {/* 点 */}
          {dots.map((d) => {
            const li = LANE_ORDER.indexOf(d.e.lane)
            const y = SW_TOP + li * SW_ROW + SW_ROW / 2 + d.dy
            const hex = LANE_META[d.e.lane].hex
            const faded = dim(d.e)
            return (
              <g key={d.e.id} opacity={faded ? 0.22 : 1}>
                <title>{`${d.e.date} · ${d.e.title}`}</title>
                {d.e.star && <circle cx={d.x} cy={y} r="6.5" fill="none" stroke={hex} strokeWidth="1" opacity="0.5" />}
                <circle cx={d.x} cy={y} r={d.e.star ? 4 : 3} fill={hex} />
              </g>
            )
          })}
        </svg>
      </div>

      {/* ---------- 筛选 ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow shrink-0">线索</span>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const on = f.v === filter
            const hex = f.v === 'all' || f.v === 'star' ? '#22D3EE' : LANE_META[f.v].hex
            return (
              <button
                key={f.v}
                type="button"
                onClick={() => setFilter(f.v)}
                className="px-2.5 py-1 rounded-md font-mono text-[11px] transition border"
                style={
                  on
                    ? { color: hex, borderColor: `${hex}70`, background: `${hex}1F` }
                    : { color: '#5A6B85', borderColor: '#1B2740', background: 'transparent' }
                }
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <span className="font-mono text-[11px] text-fg-dim ml-auto">
          {visible.length} / {EVOLUTION.length} 条
        </span>
      </div>

      {/* ---------- 纵向时间轴 ---------- */}
      <div className="relative pl-7 md:pl-9">
        <div className="absolute left-[9px] md:left-[13px] top-2 bottom-2 w-px bg-line" />
        {visible.map((e, i) => {
          const meta = LANE_META[e.lane]
          const prev = i > 0 ? visible[i - 1] : null
          const newYear = !prev || prev.date.slice(0, 4) !== e.date.slice(0, 4)
          return (
            <div key={e.id} className="relative pb-8">
              <span
                className="absolute -left-[23px] md:-left-[29px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-void"
                style={{ background: meta.hex }}
              />
              {newYear && (
                <div className="font-mono text-[11px] text-fg-dim mb-2 -ml-1">{e.date.slice(0, 4)}</div>
              )}
              <div
                className="rounded-lg border border-line bg-panel p-4 transition hover:border-white/10"
                style={{ borderLeft: `2px solid ${meta.hex}` }}
              >
                <div className="flex items-baseline gap-2.5 flex-wrap mb-1.5">
                  <span className="font-mono text-[11px] text-fg-dim">{e.date}</span>
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: meta.hex, background: `${meta.hex}18`, border: `1px solid ${meta.hex}44` }}
                  >
                    {meta.label}
                  </span>
                  {e.star && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-neon/40 text-neon bg-neon/10">
                      焦点相关
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-base mb-0.5">{e.title}</h3>
                <div className="font-mono text-[11px] text-fg-dim mb-2.5">{e.who}</div>
                <p className="text-sm text-fg-muted leading-relaxed">{e.body}</p>
                {e.link && (
                  <div className="mt-3">
                    <Link
                      href={e.link.href}
                      className="font-mono text-[11px] transition hover:text-glow"
                      style={{ color: meta.hex }}
                    >
                      {e.link.label}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function swX(yearFloat: number): number {
  const r = (yearFloat - EVO_MIN) / (EVO_MAX - EVO_MIN)
  return SW_PAD_L + r * (SW_W - SW_PAD_L - SW_PAD_R)
}

interface Dot {
  e: EvoEvent
  x: number
  dy: number
}

/** 按泳道排点，太挤的上下错开 6px */
function buildDots(all: EvoEvent[]): Dot[] {
  const out: Dot[] = []
  for (const lane of LANE_ORDER) {
    const list = all.filter((e) => e.lane === lane).sort((a, b) => a.t - b.t)
    let lastX = -Infinity
    list.forEach((e, i) => {
      const x = swX(e.t)
      const close = x - lastX < 11
      out.push({ e, x, dy: close ? (i % 2 === 0 ? -6 : 6) : 0 })
      if (!close) lastX = x
    })
  }
  return out
}
