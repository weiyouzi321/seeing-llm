'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  PANORAMA,
  LEVER_META,
  FILTERS,
  SORTS,
  applyFilter,
  applySort,
  sparsityOf,
  type FilterId,
  type SortId,
} from '@/lib/panorama'
import { MODEL_ROUTE } from '@/lib/routes'
import { Seg } from '@/components/opviz/ui'

/**
 * A1 · 开源模型全景对比表
 *
 * 设计意图：这张表不是「跑分榜」，而是回答三个趋势问题 ——
 *   ① 稀疏度：总参数涨得比激活参数快多少？（散点图 sparsity 模式）
 *   ② 上下文：1M 是哪一年变成标配的？（ctx 模式）
 *   ③ 规模：参数总量是不是还在涨？（scale 模式）
 *
 * 所以散点图给了三种可切换的轴，表格只负责把原始数字摆出来。
 */

type AxisMode = 'sparsity' | 'ctx' | 'scale'

const AXES: { v: AxisMode; label: string; x: string; y: string; note: string }[] = [
  {
    v: 'sparsity',
    label: '稀疏度',
    x: '总参数（对数）',
    y: '激活参数（对数）',
    note: '虚线是「稠密」参照（激活 = 总参）。点离虚线越远，说明这个模型越稀疏。',
  },
  {
    v: 'ctx',
    label: '上下文',
    x: '发布时间',
    y: '上下文长度（对数）',
    note: '1M 在 2025 下半年开始出现，2026 年三个焦点模型全部站在 1M 这一档。',
  },
  {
    v: 'scale',
    label: '规模',
    x: '发布时间',
    y: '总参数（对数）',
    note: '总参数的天花板被一路往上推，但激活参数始终留在几十 B 的区间里。',
  },
]

const W = 680
const H = 320
const PAD_L = 46
const PAD_R = 16
const PAD_T = 14
const PAD_B = 32

const log10 = Math.log10

function lin(v: number, a: number, b: number): number {
  return (v - a) / (b - a)
}

export function PanoramaTable() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [sort, setSort] = useState<SortId>('time')
  const [axis, setAxis] = useState<AxisMode>('sparsity')
  const [sel, setSel] = useState<string | null>('kimi-k3')

  const rows = useMemo(
    () => applySort(sort, applyFilter(filter, PANORAMA)),
    [filter, sort],
  )

  const selModel = PANORAMA.find((m) => m.id === sel) ?? null

  /* ---------------- 散点坐标 ---------------- */

  const geo = useMemo(() => {
    if (axis === 'sparsity') {
      const xMin = log10(50) // 50B
      const xMax = log10(4000) // 4T
      const yMin = log10(3)
      const yMax = log10(600)
      return {
        xMin,
        xMax,
        yMin,
        yMax,
        xTicks: [100, 500, 1000, 2800],
        yTicks: [5, 32, 104, 405],
        px: (m: (typeof PANORAMA)[number]) => log10(Math.max(50, m.total)),
        py: (m: (typeof PANORAMA)[number]) => log10(Math.max(3, m.active)),
        xFmt: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}T` : `${v}B`),
        yFmt: (v: number) => `${v}B`,
      }
    }
    if (axis === 'ctx') {
      const xMin = 2024.4
      const xMax = 2026.9
      const yMin = log10(20000)
      const yMax = log10(1_500_000)
      return {
        xMin,
        xMax,
        yMin,
        yMax,
        xTicks: [2024.7, 2025.4, 2026.1, 2026.9],
        yTicks: [32768, 131072, 262144, 1048576],
        px: (m: (typeof PANORAMA)[number]) => m.t,
        py: (m: (typeof PANORAMA)[number]) => log10(Math.max(20000, m.ctx)),
        xFmt: (v: number) => `${Math.floor(v)}.${String(Math.round((v % 1) * 12) + 1).padStart(2, '0')}`,
        yFmt: (v: number) => (v >= 1_000_000 ? '1M' : `${Math.round(v / 1024)}K`),
      }
    }
    const xMin = 2024.4
    const xMax = 2026.9
    const yMin = log10(50)
    const yMax = log10(4000)
    return {
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks: [2024.7, 2025.4, 2026.1, 2026.9],
      yTicks: [100, 500, 1000, 2800],
      px: (m: (typeof PANORAMA)[number]) => m.t,
      py: (m: (typeof PANORAMA)[number]) => log10(Math.max(50, m.total)),
      xFmt: (v: number) => `${Math.floor(v)}.${String(Math.round((v % 1) * 12) + 1).padStart(2, '0')}`,
      yFmt: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}T` : `${v}B`),
    }
  }, [axis])

  const sx = (m: (typeof PANORAMA)[number]) =>
    PAD_L + lin(geo.px(m), geo.xMin, geo.xMax) * (W - PAD_L - PAD_R)
  const sy = (m: (typeof PANORAMA)[number]) =>
    PAD_T + (1 - lin(geo.py(m), geo.yMin, geo.yMax)) * (H - PAD_T - PAD_B)

  const axisMeta = AXES.find((a) => a.v === axis) ?? AXES[0]

  return (
    <div className="space-y-6">
      {/* ---------------- 控制条 ---------------- */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="eyebrow shrink-0">筛选</span>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const on = f.id === filter
              return (
                <button
                  key={f.id}
                  type="button"
                  title={f.hint}
                  onClick={() => setFilter(f.id)}
                  className="px-2.5 py-1 rounded-md font-mono text-[11px] transition border"
                  style={
                    on
                      ? {
                          color: '#22D3EE',
                          borderColor: 'rgba(34,211,238,0.45)',
                          background: 'rgba(34,211,238,0.12)',
                        }
                      : { color: '#5A6B85', borderColor: '#1B2740', background: 'transparent' }
                  }
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="eyebrow shrink-0">排序</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="排序方式"
            className="px-2.5 py-1.5 rounded-md bg-raised border border-line text-fg-muted font-mono text-[11px] outline-none focus:border-neon/50"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="font-mono text-[11px] text-fg-dim ml-auto">
            {rows.length} / {PANORAMA.length} 个模型
          </span>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <span className="eyebrow shrink-0 mt-1.5">散点轴</span>
          <Seg options={AXES.map((a) => ({ v: a.v, label: a.label }))} value={axis} onChange={setAxis} />
        </div>
      </div>

      {/* ---------------- 散点图 ---------------- */}
      <div className="panel p-5">
        <div className="eyebrow mb-1">散点 · {axisMeta.label}</div>
        <div className="font-mono text-[11px] text-fg-dim mb-4">
          X：{axisMeta.x} · Y：{axisMeta.y}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${axisMeta.label}散点图`}>
          {/* 网格 */}
          {geo.yTicks.map((tv) => {
            const v = axis === 'sparsity' || axis === 'scale' ? log10(tv) : log10(tv)
            const y = PAD_T + (1 - lin(v, geo.yMin, geo.yMax)) * (H - PAD_T - PAD_B)
            return (
              <g key={`y${tv}`}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#1B2740" strokeWidth="1" />
                <text
                  x={PAD_L - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#5A6B85"
                  fontFamily="monospace"
                >
                  {geo.yFmt(tv)}
                </text>
              </g>
            )
          })}
          {geo.xTicks.map((tv) => {
            const v = axis === 'sparsity' || axis === 'scale' ? log10(tv) : tv
            const x = PAD_L + lin(v, geo.xMin, geo.xMax) * (W - PAD_L - PAD_R)
            return (
              <text
                key={`x${tv}`}
                x={x}
                y={H - 12}
                textAnchor="middle"
                fontSize="9"
                fill="#5A6B85"
                fontFamily="monospace"
              >
                {geo.xFmt(tv)}
              </text>
            )
          })}

          {/* 稠密参照线（仅稀疏度模式） */}
          {axis === 'sparsity' && (
            <>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="rgba(148,163,184,0.35)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={W - PAD_R - 4}
                y={PAD_T + 12}
                textAnchor="end"
                fontSize="9"
                fill="#64748B"
                fontFamily="monospace"
              >
                稠密（激活 = 总参）
              </text>
            </>
          )}

          {/* 点 */}
          {rows.map((m) => {
            const cx = sx(m)
            const cy = sy(m)
            const hex = LEVER_META[m.lever].hex
            const on = m.id === sel
            const isFocus = !!m.focus
            return (
              <g
                key={m.id}
                onClick={() => setSel(m.id)}
                style={{ cursor: 'pointer' }}
                transform={`translate(${cx} ${cy})`}
              >
                <title>
                  {m.name} · {m.total}B / {m.active}B · {m.ctxLabel}
                </title>
                {on && <circle r="13" fill={hex} opacity="0.18" />}
                <circle
                  r={isFocus ? 6.5 : 5}
                  fill={hex}
                  opacity={sel == null || on ? 0.95 : 0.55}
                  stroke={isFocus ? '#E6EDF7' : 'transparent'}
                  strokeWidth={isFocus ? 1.4 : 0}
                />
                {(isFocus || on) && (
                  <text
                    y={-12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#E6EDF7"
                    fontFamily="monospace"
                  >
                    {m.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* 图例 */}
        <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-mono">
          {Object.entries(LEVER_META).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: v.hex }} />
              <span style={{ color: v.hex }}>{v.label}</span>
            </span>
          ))}
          <span className="text-fg-dim">· 白圈 + 名称 = 三个焦点模型</span>
        </div>

        <p className="text-xs text-fg-dim leading-relaxed mt-3">{axisMeta.note}</p>

        {/* 选中详情 */}
        {selModel && (
          <div className="mt-5 rounded-lg border border-line bg-raised/40 p-4">
            <div className="flex items-baseline gap-3 flex-wrap mb-2">
              <span className="font-semibold" style={{ color: LEVER_META[selModel.lever].hex }}>
                {selModel.name}
              </span>
              <span className="font-mono text-[11px] text-fg-dim">
                {selModel.org} · {selModel.releasedLabel}
              </span>
              {selModel.focus && (
                <Link
                  href={`/architecture/${MODEL_ROUTE[selModel.focus]}`}
                  className="font-mono text-[11px] text-neon ml-auto"
                >
                  打开逐层解剖 →
                </Link>
              )}
            </div>
            <p className="text-sm text-fg-muted leading-relaxed mb-3">{selModel.why}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <Cell k="总参数" v={`${selModel.total}B`} />
              <Cell k="激活参数" v={`${selModel.active}B`} />
              <Cell k="稀疏度" v={`${sparsityOf(selModel).toFixed(1)}%`} />
              <Cell k="上下文" v={selModel.ctxLabel} />
              <Cell k="层数" v={selModel.layers ? String(selModel.layers) : '—'} />
              <Cell k="注意力" v={selModel.attn} />
              <Cell k="MoE" v={selModel.experts ?? '稠密'} />
              <Cell k="许可" v={selModel.license} />
            </div>
          </div>
        )}
      </div>

      {/* ---------------- 表格 ---------------- */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left p-3 eyebrow font-normal">模型</th>
              <th className="text-left p-3 eyebrow font-normal">时间</th>
              <th className="text-right p-3 eyebrow font-normal">总参</th>
              <th className="text-right p-3 eyebrow font-normal">激活</th>
              <th className="text-left p-3 eyebrow font-normal">稀疏度</th>
              <th className="text-right p-3 eyebrow font-normal">层</th>
              <th className="text-left p-3 eyebrow font-normal">注意力</th>
              <th className="text-left p-3 eyebrow font-normal">MoE</th>
              <th className="text-right p-3 eyebrow font-normal">上下文</th>
              <th className="text-left p-3 eyebrow font-normal">许可</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const hex = LEVER_META[m.lever].hex
              const on = m.id === sel
              return (
                <tr
                  key={m.id}
                  onClick={() => setSel(m.id)}
                  className="border-b border-line/50 align-top cursor-pointer transition"
                  style={on ? { background: 'rgba(34,211,238,0.06)' } : undefined}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: hex }} />
                      {m.focus ? (
                        <Link
                          href={`/architecture/${MODEL_ROUTE[m.focus]}`}
                          className="font-semibold hover:underline"
                          style={{ color: hex }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {m.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-fg">{m.name}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-dim leading-snug mt-1 max-w-[260px]">{m.why}</div>
                  </td>
                  <td className="p-3 font-mono text-xs text-fg-dim whitespace-nowrap">{m.releasedLabel}</td>
                  <td className="p-3 font-mono text-xs text-fg-muted text-right tabular-nums whitespace-nowrap">
                    {fmtB(m.total)}
                  </td>
                  <td className="p-3 font-mono text-xs text-fg text-right tabular-nums whitespace-nowrap">
                    {fmtB(m.active)}
                  </td>
                  <td className="p-3 w-[110px]">
                    <div className="h-1.5 rounded-sm bg-white/[0.04] overflow-hidden mb-1">
                      <div
                        className="h-full rounded-sm"
                        style={{ width: `${Math.max(1.5, sparsityOf(m))}%`, background: hex }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-fg-dim tabular-nums">
                      {sparsityOf(m).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-fg-muted text-right tabular-nums">
                    {m.layers ?? '—'}
                  </td>
                  <td className="p-3 text-xs text-fg-muted max-w-[190px] leading-snug">{m.attn}</td>
                  <td className="p-3 font-mono text-[11px] text-fg-dim whitespace-nowrap">
                    {m.experts ?? '—'}
                  </td>
                  <td className="p-3 font-mono text-xs text-fg-muted text-right whitespace-nowrap">
                    {m.ctxLabel}
                  </td>
                  <td className="p-3 text-[11px] whitespace-nowrap">
                    <span
                      className={m.licenseTone === 'open' ? 'text-fg-muted' : 'text-fg-dim'}
                      title={
                        m.licenseTone === 'open'
                          ? '宽松许可：可商用、可再分发'
                          : '有附加条件或自定义许可，商用前请读条款'
                      }
                    >
                      {m.license}
                      {m.licenseTone === 'restricted' && <span className="text-amber-400/70"> ⚠</span>}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 杠杆说明 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(LEVER_META).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-raised/30 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: v.hex }} />
              <span className="font-semibold text-sm" style={{ color: v.hex }}>
                {v.label}
              </span>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtB(v: number): string {
  if (v >= 1000) {
    const t = v / 1000
    return `${t % 1 === 0 ? t.toFixed(0) : t.toFixed(2)}T`
  }
  return `${v}B`
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] text-fg-dim">{k}</div>
      <div className="text-fg-muted tabular-nums">{v}</div>
    </div>
  )
}
