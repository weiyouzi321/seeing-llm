'use client'

import { useState } from 'react'
import { Slider, Stat, Note, Seg } from '@/components/opviz/ui'

/**
 * CED（Causal Encoder-Decoder）—— prompt 侧的 KV 到底要算几遍
 *
 * 简化模型（页面上有标注）：
 *   · decoder-only：n 个解码层各有自己的一份 prompt KV → n·P
 *   · CED：        编码器算出一份全局 KV，n 个解码层共享 → 1·P
 *   生成侧两者都只保留一个滑动窗口 W（每层各一份）。
 *
 * 于是 KV 条目数：  decoder-only = n·(P + W)
 *                  CED          = P + n·W
 * 这个式子比「省了多少」更值得记住的点在于：
 * 收益完全来自「把 P 从 n 份压成 1 份」，和 W 无关 —— prompt 越长赚得越多。
 */

const P_STEPS = [
  { v: 1024, label: '1K' },
  { v: 4096, label: '4K' },
  { v: 16384, label: '16K' },
  { v: 65536, label: '64K' },
  { v: 262144, label: '256K' },
  { v: 1048576, label: '1M' },
]

export function CedFlow() {
  const [pi, setPi] = useState(3) // 默认 64K
  const [w, setW] = useState(512) // 滑动窗口
  const [n, setN] = useState(20) // 解码层数

  const P = P_STEPS[pi].v

  const kvPlain = n * (P + w)
  const kvCed = P + n * w
  const cut = 1 - kvCed / kvPlain

  const max = Math.max(kvPlain, kvCed)
  const hPlain = (kvPlain / max) * 100
  const hCed = (kvCed / max) * 100

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">prompt 侧 KV 份数 · 解码层数 n = {n}</div>
      <div className="font-mono text-sm mb-5">
        prompt <span className="text-neon font-semibold">{P_STEPS[pi].label}</span>
        <span className="text-fg-dim"> · 滑动窗口 {w}</span>
      </div>

      {/* 纵向结构图 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Struct title="Decoder-only" color="#94A3B8" note="每层各存一份 prompt KV">
          <KVStack rows={3} shared={false} total={n} />
          <div className="mt-2 font-mono text-[11px] text-fg-dim">
            {n} 层 × ({P.toLocaleString()} + {w}) ={' '}
            <span className="text-fg-muted">{kvPlain.toLocaleString()}</span> 条目
          </div>
        </Struct>
        <Struct title="CED" color="#22D3EE" note="全局 KV 由编码器末层投影，跨层共享">
          <KVStack rows={3} shared total={n} />
          <div className="mt-2 font-mono text-[11px] text-fg-dim">
            {P.toLocaleString()} + {n} × {w} ={' '}
            <span className="text-neon font-semibold">{kvCed.toLocaleString()}</span> 条目
          </div>
        </Struct>
      </div>

      {/* 双柱 */}
      <div className="flex items-end justify-center gap-12 h-44 mb-5">
        <Bar h={hPlain} color="#94A3B8" label="Decoder-only" value={compact(kvPlain)} />
        <Bar h={hCed} color="#22D3EE" label="CED 共享全局 KV" value={compact(kvCed)} />
      </div>

      {/* 控制区 */}
      <div className="grid md:grid-cols-2 gap-x-6 mb-5">
        <Slider
          label="prompt 长度（对数刻度）"
          value={pi}
          min={0}
          max={P_STEPS.length - 1}
          onChange={setPi}
          display={P_STEPS[pi].label}
        />
        <Slider
          label="解码层数 n"
          value={n}
          min={4}
          max={40}
          step={4}
          onChange={setN}
          display={`${n} 层`}
        />
      </div>
      <Slider
        label="滑动窗口 W（生成侧每层各留一份）"
        value={w}
        min={128}
        max={4096}
        step={128}
        onChange={setW}
        display={`${w} tokens`}
      />

      {/* 结论数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat k="KV 削减" v={`${(cut * 100).toFixed(1)}%`} color="#22D3EE" />
        <Stat
          k="共享比"
          v={`${kvPlain.toLocaleString()} : ${kvCed.toLocaleString()}`}
          sub="→ 压缩倍数"
        />
        <Stat k="prefill 激活" v="8B" sub="编码器只跑一次" color="#FB923C" />
        <Stat k="decode 激活" v="16B" sub="解码承担主体" color="#FB923C" />
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {P <= 4096 ? (
          <>
            prompt 还短，<span className="text-fg">两份之差被 n 放大得不够多</span> —— CED 的优势要在 prompt
            明显长于滑动窗口之后才显现。这也解释了它的{' '}
            <span className="text-v4">主要限制</span>：编码器天生要先看完整段 prompt，不适合流式追加。
          </>
        ) : cut > 0.7 ? (
          <>
            此时削减已超过 70%，而且几乎全部来自「把这份 [<span className="font-mono">P</span>] 从{' '}
            <span className="text-fg">{n} 份</span>压成 <span className="text-neon">1 份</span>」。
            这就是为什么 V4.1 Flash 敢用 decoder-only 里显得奢侈的{' '}
            <span className="text-v4">8B / 16B 非对称激活</span> —— 编码器只跑一次，prefill 侧可以省着花。
          </>
        ) : (
          <>
            中间地带。共享带来的削减正在上升，但 prompt 与滑动窗口量级接近时，生成侧的 n·W 会拖住收益。
          </>
        )}
      </p>

      <Note>
        简化模型的三条假设：① 只统计「要存多少个 token 位」，不计 head 数与每 head 维度（那些对两者同号）；
        ② CED 的全局 KV 计为编码器末层的一份投影；③ 生成侧两者都保留逐层滑动窗口。
        真实数字还会叠加 FP4 主 KV（官方口径 890 字节 / token）等压缩手段。
      </Note>
    </div>
  )
}

/* ---------------- 子件 ---------------- */

function Struct({
  title,
  color,
  note,
  children,
}: {
  title: string
  color: string
  note: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg border bg-raised/40 p-4"
      style={{ borderColor: `${color}44` }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {title}
        </span>
        <span className="text-[11px] text-fg-dim">{note}</span>
      </div>
      {children}
    </div>
  )
}

/** 解码层 + 它们的 prompt KV：shared = 全部指向同一份 */
function KVStack({ rows, shared, total }: { rows: number; shared: boolean; total: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-fg-dim w-9 text-right shrink-0">
            L{i * Math.floor(total / rows) + 1}
          </span>
          <div className="flex-1 h-3.5 rounded-sm border border-line bg-white/[0.03]" />
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
            style={
              shared
                ? { color: '#67E8F9', background: 'rgba(34,211,238,0.14)' }
                : { color: '#CBD5E1', background: 'rgba(148,163,184,0.14)' }
            }
          >
            {shared ? '共享' : '专属'}
          </span>
        </div>
      ))}
      <div className="pl-11">
        <div
          className="h-2 rounded-sm"
          style={{
            background: shared
              ? 'linear-gradient(90deg, rgba(34,211,238,0.2), #22D3EE)'
              : 'linear-gradient(90deg, rgba(148,163,184,0.14), rgba(148,163,184,0.4))',
          }}
        />
      </div>
    </div>
  )
}

function Bar({
  h,
  color,
  label,
  value,
}: {
  h: number
  color: string
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center justify-end h-full w-32">
      <span className="font-mono text-xs mb-1.5 tabular-nums" style={{ color }}>
        {value}
      </span>
      <div
        className="w-full rounded-t-md transition-all duration-300"
        style={{
          height: `${Math.max(h, 2)}%`,
          background: `linear-gradient(180deg, ${color}33, ${color})`,
          boxShadow: `0 0 20px -6px ${color}`,
        }}
      />
      <div className="mt-2 text-center">
        <div className="text-xs" style={{ color }}>
          {label}
        </div>
        <div className="font-mono text-[10px] text-fg-dim">KV 条目 / 序列</div>
      </div>
    </div>
  )
}

function compact(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return String(v)
}
