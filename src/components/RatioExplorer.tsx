'use client'

import { useState } from 'react'
import { LAYER_STYLE } from '@/lib/models'

/**
 * 线性 : 全注意力 配比探索器
 *
 * 核心：只有「全注意力层」需要存 KV Cache。
 * 若每 (n 线性 + 1 全) 循环一次，则全注意力层占比 1/(n+1)，
 * KV Cache 削减 = 1 − 1/(n+1) = n/(n+1)。
 *
 * K3 / Qwen3.8 都取 n = 3 → 削减 75%，与官方「KV Cache 最多削减 75%」吻合。
 */
export function RatioExplorer() {
  const [n, setN] = useState(3)
  const total = n + 1
  const kvCut = n / total
  const fullShare = 1 / total
  const isK3 = n === 3

  return (
    <div className="panel p-6">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
        <div>
          <div className="eyebrow mb-1">配比探索器</div>
          <div className="font-mono text-sm">
            每 <span className="text-k3 font-semibold">{n}</span> 层线性注意力 +{' '}
            <span className="text-v4 font-semibold">1</span> 层全注意力
          </div>
        </div>
        {isK3 && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-k3/40 bg-k3/10 text-k3">
            K3 / Qwen3.8 的实际取值
          </span>
        )}
      </div>

      {/* 层块可视化 */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {Array.from({ length: total }, (_, i) => {
          const isFull = i === total - 1
          const st = isFull ? LAYER_STYLE.full : LAYER_STYLE.linear
          return (
            <div
              key={i}
              className="w-11 h-11 rounded-md border flex items-center justify-center font-mono text-xs"
              style={{ background: st.fill, borderColor: st.stroke, color: st.text }}
            >
              {isFull ? '全' : '线'}
            </div>
          )
        })}
        <span className="font-mono text-xs text-fg-dim ml-3">× 重复 23 次</span>
      </div>

      {/* 滑块 */}
      <label className="block mb-6">
        <span className="font-mono text-xs text-fg-dim">线性层数 n</span>
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full mt-2 accent-[#22D3EE]"
          aria-label="线性注意力层数"
        />
        <div className="flex justify-between font-mono text-[10px] text-fg-dim mt-1">
          <span>1（最保守）</span>
          <span>8</span>
          <span>15（最激进）</span>
        </div>
      </label>

      {/* 结果 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Result label="全注意力层占比" value={`${(fullShare * 100).toFixed(1)}%`} />
        <Result label="KV Cache 削减" value={`${(kvCut * 100).toFixed(1)}%`} accent />
        <Result label="每循环层数" value={String(total)} />
        <Result label="92 层中的全注意力" value={`${Math.round(92 * fullShare)} 层`} />
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {n <= 2
          ? '全注意力层占比高，表达力足，但 KV Cache 省不了多少 —— 长上下文依然贵。'
          : n <= 5
          ? '这就是 K3 与 Qwen3.8 选的区间：砍掉四分之三的 KV，同时靠每 4 层一次的全注意力把表达力补回来。'
          : '越激进省得越多，但全注意力层太少会丢掉需要全局建模的能力 —— 省下的显存换来的可能是长文本理解下降。'}
      </p>
    </div>
  )
}

function Result({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-2">
      <div className={`font-mono font-semibold text-base ${accent ? 'text-neon' : 'text-fg'}`}>
        {value}
      </div>
      <div className="text-[11px] text-fg-dim mt-0.5">{label}</div>
    </div>
  )
}
