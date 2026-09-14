'use client'

import { useState } from 'react'

/**
 * 全注意力 vs 线性注意力 的代价曲线
 *
 * 全注意力要对每个 query 算 L 个 key 的分数 → 计算量 ∝ L²·d
 * 线性注意力维护一个递推状态         → 计算量 ∝ L·d²
 * 两者之比 = (L²·d) / (L·d²) = L / d
 *
 * 关键洞察：L < d 时线性注意力并不省；只有 L ≫ d 才开始碾压。
 * 以 K3 的隐藏维 d = 7168 为例，只有序列过万之后优势才明显。
 */
const D = 7168 // Kimi K3 hidden size

const STEPS = [
  { l: 4096, label: '4K' },
  { l: 8192, label: '8K' },
  { l: 16384, label: '16K' },
  { l: 32768, label: '32K' },
  { l: 65536, label: '64K' },
  { l: 131072, label: '128K' },
  { l: 262144, label: '256K' },
  { l: 524288, label: '512K' },
  { l: 1048576, label: '1M' },
]

export function AttentionScaling() {
  const [i, setI] = useState(4) // 默认 64K
  const { l } = STEPS[i]

  // 归一化：以全注意力为 100%
  const fullCost = 1
  const linearCost = D / l
  const ratio = fullCost / linearCost // 全注意力是线性的多少倍

  // 柱高：以两者最大值为满高
  const maxV = Math.max(fullCost, linearCost)
  const hFull = (fullCost / maxV) * 100
  const hLinear = (linearCost / maxV) * 100

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">代价对比 · 固定隐藏维 d = {D.toLocaleString()}</div>
      <div className="font-mono text-sm mb-5">
        序列长度 <span className="text-neon font-semibold">{STEPS[i].label}</span>
        <span className="text-fg-dim"> （{l.toLocaleString()} tokens）</span>
      </div>

      {/* 双柱 */}
      <div className="flex items-end justify-center gap-10 h-44 mb-4">
        <Bar h={hFull} color="#22D3EE" label="全注意力" sub="∝ L²·d" value="100%" />
        <Bar
          h={hLinear}
          color="#A78BFA"
          label="线性注意力"
          sub="∝ L·d²"
          value={`${(linearCost * 100).toFixed(linearCost < 0.01 ? 2 : 1)}%`}
        />
      </div>

      {/* 滑块 */}
      <label className="block mb-5">
        <span className="font-mono text-xs text-fg-dim">序列长度（对数刻度）</span>
        <input
          type="range"
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          className="w-full mt-2 accent-[#22D3EE]"
          aria-label="序列长度"
        />
        <div className="flex justify-between font-mono text-[10px] text-fg-dim mt-1">
          {STEPS.filter((_, k) => k % 2 === 0).map((s) => (
            <span key={s.l}>{s.label}</span>
          ))}
        </div>
      </label>

      {/* 结论 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-line bg-raised/40 px-3 py-2">
          <div className="font-mono font-semibold text-base text-neon">
            {ratio < 1 ? `${(1 / ratio).toFixed(2)}×` : `${ratio.toFixed(1)}×`}
          </div>
          <div className="text-[11px] text-fg-dim mt-0.5">
            {ratio < 1 ? '线性反而更贵' : '全注意力是线性的倍数'}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-raised/40 px-3 py-2">
          <div className="font-mono font-semibold text-base text-fg">
            {(l / D).toFixed(2)}
          </div>
          <div className="text-[11px] text-fg-dim mt-0.5">L / d（决定谁划算）</div>
        </div>
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {ratio < 1 ? (
          <>
            此时 <span className="text-fg">L &lt; d</span>，线性注意力维护状态的开销（∝ d²）
            反而高于直接算 L 个分数。这就是为什么「无脑换线性注意力」是错的 ——
            K3 用 <span className="text-k3">3:1 配比</span>而非全线性，正是要在短上下文中保留全注意力的效率优势。
          </>
        ) : ratio < 10 ? (
          <>
            刚过盈亏平衡点。线性注意力的优势还不明显，
            这也是为什么 32K 以下的长上下文方案通常不需要动注意力结构。
          </>
        ) : (
          <>
            到了这个长度，全注意力的 <span className="text-v4">L²</span> 项已经主导一切 ——
            这就是 K3 敢把上下文推到 <span className="text-neon">1M</span> 的前提：
            只有 1/4 的层付这个代价，其余 3/4 走线性。
          </>
        )}
      </p>
    </div>
  )
}

function Bar({
  h,
  color,
  label,
  sub,
  value,
}: {
  h: number
  color: string
  label: string
  sub: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center justify-end h-full w-28">
      <span className="font-mono text-xs mb-1.5" style={{ color }}>
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
        <div className="text-xs" style={{ color }}>{label}</div>
        <div className="font-mono text-[10px] text-fg-dim">{sub}</div>
      </div>
    </div>
  )
}
