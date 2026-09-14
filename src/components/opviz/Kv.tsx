'use client'

import { useState } from 'react'
import { Note, Slider, Stat } from './ui'

/**
 * KV Cache 的收益：把「每步重算全部」变成「只算新 token」。
 *
 *   无缓存：第 t 步要算 Q(全 t 个) × K(全 t 个) → t² 个元素
 *   有缓存：只算 Q(新 1 个) × K(缓存 t 个)   → t  个元素
 *   累计到 L：Σt² = L(L+1)(2L+1)/6   vs   Σt = L(L+1)/2
 *   比值 = (2L+1)/3 —— 随 L 线性增长
 */
export function KvCacheDemo() {
  const [L, setL] = useState(16)

  const noCache = (L * (L + 1) * (2 * L + 1)) / 6
  const withCache = (L * (L + 1)) / 2
  const ratio = noCache / withCache
  const stepNo = L * L
  const stepWith = L
  const maxV = Math.max(noCache, withCache)

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">增量解码 · 已生成 {L} 个 token</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        自回归生成时，前 t−1 个 token 的 K/V 在之前的步骤里已经算过了 ——
        缓存下来，每步就只剩一个新 token 的活。代价是显存随序列线性增长。
      </p>

      <Slider label="序列长度 L" value={L} min={1} max={64} step={1} onChange={setL} display={`${L} tokens`} />

      {/* 累计计算量 */}
      <div className="eyebrow mb-2">累计注意力元素数（相对值）</div>
      <div className="space-y-3 mb-6">
        <Bar2 label="无 KV Cache" sub="Σ t² = L(L+1)(2L+1)/6" v={noCache} max={maxV} color="#FB923C" text={noCache.toLocaleString()} />
        <Bar2 label="有 KV Cache" sub="Σ t = L(L+1)/2" v={withCache} max={maxV} color="#22D3EE" text={withCache.toLocaleString()} />
      </div>

      {/* 本步 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat k="本步 · 无缓存" v={`${stepNo.toLocaleString()}`} sub="t² 个元素" color="#FB923C" />
        <Stat k="本步 · 有缓存" v={`${stepWith.toLocaleString()}`} sub="t 个元素" color="#22D3EE" />
        <Stat k="本步加速" v={`${L}×`} sub="t² / t = t" color="#A78BFA" />
        <Stat k="累计加速" v={`${ratio.toFixed(1)}×`} sub="(2L+1)/3" />
      </div>

      {/* 缓存增长：slot 可视化 */}
      <div className="eyebrow mb-2">KV 缓存占用（slot 数随 L 线性增长）</div>
      <div className="flex flex-wrap gap-[3px] p-3 rounded-lg border border-line bg-void/60 mb-2">
        {Array.from({ length: L }, (_, i) => (
          <div
            key={i}
            className="w-3 h-6 rounded-[2px]"
            style={{
              background: `rgba(34,211,238,${0.25 + (i / Math.max(L, 1)) * 0.7})`,
              boxShadow: i === L - 1 ? '0 0 10px rgba(34,211,238,0.8)' : 'none',
            }}
            title={`slot ${i}`}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-fg-dim mb-4">
        <span>0</span>
        <span>{L} 个 slot × 2（K 与 V）× 层数 × 头数 × 头维 × 每元素字节</span>
        <span>{L}</span>
      </div>

      <Note>
        真实数字感受一下：DeepSeek V4.1 Flash 把主 KV 压到 FP4，官方口径
        <span className="text-fg"> 890 字节 / token</span>。按 1M 上下文算，
        光 KV 就是 890 MB / 序列 —— 这还没算 batch。所以「削减 KV Cache」
        从来不是优化题，而是长上下文能不能落地的生死题。
      </Note>
    </div>
  )
}

function Bar2({
  label,
  sub,
  v,
  max,
  color,
  text,
}: {
  label: string
  sub: string
  v: number
  max: number
  color: string
  text: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[10px] text-fg-dim">{sub}</span>
      </div>
      <div className="h-6 bg-raised rounded overflow-hidden">
        <div
          className="h-full rounded flex items-center justify-end pr-2 transition-all duration-300"
          style={{
            width: `${Math.max((v / max) * 100, 1.5)}%`,
            background: `linear-gradient(90deg, ${color}33, ${color})`,
            boxShadow: `0 0 18px -6px ${color}`,
          }}
        >
          <span className="font-mono text-[10px] text-void font-semibold">{text}</span>
        </div>
      </div>
    </div>
  )
}
