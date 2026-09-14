'use client'

import { useState } from 'react'
import { Slider, Note } from '@/components/opviz/ui'

/**
 * KV Cache 三条路线 —— 每 token 到底要存多少字节
 *
 * 估算口径（全部写在页面上，避免看起来像精确值）：
 *   MHA 基线：每层每 token 存 K、V 两份，各 hidden 维，BF16 → 4 × hidden 字节
 *   K3：      只有 23 层 Gated MLA 存 KV，MLA 存的是 3584 维 latent → 2 × 3584 字节
 *   Qwen3.8： 只有 23 层 Gated Attention 存 KV，4 个 KV 头 × head_dim 128 → 2 × 4 × 128 × 2 字节
 *   V4.1：    官方口径 890 字节 / token（FP4 主 KV + SWA Bounded Replay）
 *
 * 结论的形状比绝对值重要：
 *   K3 与 Qwen3.8 走「减少要存的层」（3:1 配比 → 直接砍掉 3/4），
 *   V4.1 走「不改层数，把每 token 压到极致」—— 两者不在同一个杠杆上，量级差出上百倍。
 */

interface Route {
  id: string
  name: string
  hex: string
  bytesPerToken: number
  leverage: string
}

const HID_K3 = 7168
const HID_QWEN = 8192

const K3_PER_LAYER = 2 * 3584 // MLA latent, BF16
const QWEN_PER_LAYER = 2 * 4 * (HID_QWEN / 64) * 2 // 4 KV 头 × 128 维 × 2(K,V) × 2 字节
const K3_BASE = 4 * HID_K3
const QWEN_BASE = 4 * HID_QWEN

const ROUTES: Route[] = [
  {
    id: 'k3',
    name: 'Kimi K3',
    hex: '#A78BFA',
    bytesPerToken: 23 * K3_PER_LAYER,
    leverage: '减少要存的层：93 层里只有 23 层存 KV',
  },
  {
    id: 'qwen',
    name: 'Qwen3.8',
    hex: '#FB923C',
    bytesPerToken: 23 * QWEN_PER_LAYER,
    leverage: '减少要存的层 + 16:1 极端 GQA',
  },
  {
    id: 'v4',
    name: 'V4.1 Flash',
    hex: '#22D3EE',
    bytesPerToken: 890,
    leverage: '不改层数，FP4 主 KV 把每 token 压到 890 字节',
  },
]

const CTX = [8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
const CTX_LABEL = ['8K', '16K', '32K', '64K', '128K', '256K', '512K', '1M']

const W = 640
const H = 250
const PAD_L = 52
const PAD_R = 14
const PAD_T = 12
const PAD_B = 28

/** y 轴：0.1 GB → 2000 GB，对数 */
const GB_MIN = 0.1
const GB_MAX = 2000

export function KvRoutes() {
  const [budget, setBudget] = useState(80) // GB，单卡参考预算

  const x = (i: number) => PAD_L + (i / (CTX.length - 1)) * (W - PAD_L - PAD_R)
  const yGB = (gb: number) => {
    const c = Math.max(GB_MIN, Math.min(GB_MAX, gb))
    const t = (Math.log10(c) - Math.log10(GB_MIN)) / (Math.log10(GB_MAX) - Math.log10(GB_MIN))
    return PAD_T + (1 - t) * (H - PAD_T - PAD_B)
  }

  const at1M = ROUTES.map((r) => ({ r, gb: (r.bytesPerToken * 1_048_576) / 1e9 }))
  const baseline = (4 * 7168 * 93 * 1_048_576) / 1e9 // 93 层全 MHA 的参考基线

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">每 token KV 字节 → 整段上下文占多大</div>
      <div className="font-mono text-sm mb-5">
        单卡预算参考线 <span className="text-neon font-semibold">{budget} GB</span>
        <span className="text-fg-dim"> · 未计 batch 与框架开销</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-2" role="img" aria-label="KV Cache 规模曲线">
        {[0.1, 1, 10, 100, 1000].map((gb) => (
          <g key={gb}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yGB(gb)} y2={yGB(gb)} stroke="#1B2740" strokeWidth="1" />
            <text x={PAD_L - 6} y={yGB(gb) + 3} textAnchor="end" fontSize="9" fill="#5A6B85" fontFamily="monospace">
              {gb === 0.1 ? '0.1G' : `${gb}G`}
            </text>
          </g>
        ))}

        {/* 预算线 */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={yGB(budget)}
          y2={yGB(budget)}
          stroke="rgba(248,113,113,0.6)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text x={W - PAD_R} y={yGB(budget) - 5} textAnchor="end" fontSize="9" fill="#F87171" fontFamily="monospace">
          {budget} GB
        </text>

        {CTX.map((c, i) => (
          <text key={c} x={x(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#5A6B85" fontFamily="monospace">
            {CTX_LABEL[i]}
          </text>
        ))}

        {ROUTES.map((r) => {
          const pts = CTX.map((c, i) => `${x(i)},${yGB((r.bytesPerToken * c) / 1e9)}`).join(' ')
          return <polyline key={r.id} points={pts} fill="none" stroke={r.hex} strokeWidth="2" />
        })}
      </svg>

      <div className="flex flex-wrap gap-4 mb-5 text-[11px] font-mono">
        {ROUTES.map((r) => (
          <span key={r.id} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: r.hex }} />
            <span style={{ color: r.hex }}>{r.name}</span>
            <span className="text-fg-dim">{bytes(r.bytesPerToken)} / token</span>
          </span>
        ))}
      </div>

      <div className="mb-6">
        <Slider
          label="显存预算参考线"
          value={budget}
          min={8}
          max={320}
          step={8}
          onChange={setBudget}
          display={`${budget} GB`}
        />
      </div>

      {/* 三家画像 */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {ROUTES.map((r) => {
          const gb = (r.bytesPerToken * 1_048_576) / 1e9
          return (
            <div
              key={r.id}
              className="rounded-lg border bg-raised/40 p-4"
              style={{ borderColor: `${r.hex}44` }}
            >
              <div className="font-semibold text-sm mb-2" style={{ color: r.hex }}>
                {r.name}
              </div>
              <div className="font-mono text-lg font-semibold tabular-nums mb-0.5" style={{ color: r.hex }}>
                {bytes(r.bytesPerToken)}
              </div>
              <div className="text-[10px] text-fg-dim mb-2.5">每 token</div>
              <KvRow k="1M 上下文" v={gb < 1 ? `${(gb * 1024).toFixed(0)} MB` : `${gb.toFixed(1)} GB`} />
              <KvRow k="杠杆" v={r.leverage} wrap />
            </div>
          )
        })}
      </div>

      {/* 瀑布：K3 的两级削减 */}
      <div className="rounded-lg border border-line bg-raised/40 p-4 mb-5">
        <div className="eyebrow mb-2.5">分解看 · K3 的 93.8% 是怎么省出来的（单位：MB / token）</div>
        <div className="space-y-2 font-mono text-[11px]">
          <Step label="基线：93 层全用 MHA" gb={(K3_BASE * 93) / 1e6} max={(K3_BASE * 93) / 1e6} color="#475C7E" />
          <Step label="换成 MLA（每层 latent 3584）" gb={(K3_PER_LAYER * 93) / 1e6} max={(K3_BASE * 93) / 1e6} color="#A78BFA" />
          <Step label="3:1 配比（只留 23 层存 KV）" gb={(K3_PER_LAYER * 23) / 1e6} max={(K3_BASE * 93) / 1e6} color="#22D3EE" />
        </div>
        <div className="text-[11px] text-fg-dim mt-2.5 leading-relaxed">
          两级各砍约 75%，乘起来只剩 6.2%。注意「3:1 配比」这一级是本站反复出现的那条杠杆 ——{' '}
          n 层线性配 1 层全注意力，KV Cache 恰好削减 n/(n+1)。
        </div>
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        同样是「让长上下文跑得动」，K3 与 Qwen3.8 动的是<span className="text-fg">层数</span>，
        V4.1 Flash 动的是<span className="text-fg">每层的存储精度</span> —— 后者一步跨了两个数量级。
        以 1M 上下文粗略估算：K3 约 {at1M[0].gb.toFixed(0)} GB、Qwen3.8 约 {at1M[1].gb.toFixed(0)} GB、
        V4.1 Flash 约 {(at1M[2].gb * 1024).toFixed(0)} MB，而 93 层全 MHA 的基线要 {baseline.toFixed(0)} GB。
        这也解释了为什么 V4.1 Flash 一侧更强调「跨层共享主 KV」：一旦每 token 已经压到几百字节，
        决定成败的就变成「这份 KV 有没有被重复存了 20 遍」。
      </p>

      <Note>
        估算口径：MHA 基线 = 4 × hidden 字节 / 层 / token（K、V 各 hidden 维 BF16）；
        K3 = 2 × latent 3584 字节 / MLA 层 × 23 层（忽略 RoPE 部分）；
        Qwen3.8 = 4 个 KV 头 × head_dim 128 × 2(K,V) × 2 字节 × 23 层；
        V4.1 Flash 用官方口径 890 字节 / token。真实部署还要乘上 batch、页式管理与框架 padding。
      </Note>
    </div>
  )
}

function bytes(v: number): string {
  if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${v.toFixed(0)} B`
}

function KvRow({ k, v, wrap }: { k: string; v: string; wrap?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px] py-0.5">
      <span className="font-mono text-fg-dim shrink-0">{k}</span>
      <span className={`font-mono text-fg-muted tabular-nums ${wrap ? 'text-right' : ''}`}>{v}</span>
    </div>
  )
}

function Step({ label, gb, max, color }: { label: string; gb: number; max: number; color: string }) {
  const pct = Math.max(1.5, (gb / max) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-fg-muted">{label}</span>
        <span className="tabular-nums" style={{ color }}>
          {gb.toFixed(2)} MB
        </span>
      </div>
      <div className="h-2 rounded-sm bg-white/[0.03] overflow-hidden">
        <div
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }}
        />
      </div>
    </div>
  )
}
