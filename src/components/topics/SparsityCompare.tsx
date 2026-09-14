'use client'

import { useState } from 'react'
import { Slider, Note } from '@/components/opviz/ui'

/**
 * MoE 稀疏度三家对比 —— 「专家越开越多，为什么训练不崩」
 *
 * 演示的是一条能被解析写出来的性质：
 *   在负载均衡的前提下，一个专家在 T 个 token 内「一次都没被选中」的概率 ≈ (1 − k/E)^T
 *   k/E 越小（越稀疏），这条曲线下降得越慢 —— 冷启动窗口越长，越需要额外的稳定手段。
 *
 * 三家：K3 896→16（1/56）、Qwen3.8 512→10（1/51）、V4.1 Flash 384→6（1/64）
 */

interface Cfg {
  id: string
  name: string
  hex: string
  E: number
  k: number
  shared: number
  fix: string
}

const CFGS: Cfg[] = [
  {
    id: 'k3',
    name: 'Kimi K3',
    hex: '#A78BFA',
    E: 896,
    k: 16,
    shared: 2,
    fix: 'Stable LatentMoE：路由放进低维 latent 空间做 + 2 个共享专家兜底',
  },
  {
    id: 'qwen',
    name: 'Qwen3.8',
    hex: '#FB923C',
    E: 512,
    k: 10,
    shared: 1,
    fix: '专家中间维压到 2048，用更窄的专家换更多专家数',
  },
  {
    id: 'v4',
    name: 'V4.1 Flash',
    hex: '#22D3EE',
    E: 384,
    k: 6,
    shared: 1,
    fix: '最激进的 1/64 稀疏，靠 Single-Pass mHC 的流形约束残差兜底',
  },
]

const T_STEPS = [
  16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 65536, 262144, 1048576,
]

/* ---------- 图表几何 ---------- */
const W = 640
const H = 240
const PAD_L = 46
const PAD_B = 26
const PAD_T = 12

export function SparsityCompare() {
  const [ti, setTi] = useState(6) // 默认 1024
  const T = T_STEPS[ti]

  const x = (t: number) =>
    PAD_L + ((Math.log10(t) - Math.log10(T_STEPS[0])) / (Math.log10(T_STEPS[T_STEPS.length - 1]) - Math.log10(T_STEPS[0]))) * (W - PAD_L - 12)
  // y 用对数：从未被选中的概率跨越好几个数量级
  const y = (p: number) => {
    const clamped = Math.max(p, 1e-6)
    const t = (Math.log10(clamped) - Math.log10(1e-6)) / (0 - Math.log10(1e-6)) // 1e-6 → 0, 1 → 6 数量级
    return (1 - Math.min(1, Math.max(0, t))) * (H - PAD_B - PAD_T) + PAD_T
  }

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">冷启动窗口 · 负载均衡前提下的解析上界</div>
      <div className="font-mono text-sm mb-5">
        观察窗口 T = <span className="text-neon font-semibold">{T.toLocaleString()}</span>
        <span className="text-fg-dim"> tokens</span>
      </div>

      {/* 曲线 */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-2" role="img" aria-label="冷启动曲线">
        {/* 横向网格 + y 轴标签 */}
        {[1, 1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6].map((p) => (
          <g key={p}>
            <line
              x1={PAD_L}
              x2={W - 12}
              y1={y(p)}
              y2={y(p)}
              stroke="#1B2740"
              strokeWidth="1"
            />
            <text x={PAD_L - 6} y={y(p) + 3} textAnchor="end" fontSize="9" fill="#5A6B85" fontFamily="monospace">
              {p === 1 ? '1' : p === 1e-1 ? '10⁻¹' : p === 1e-2 ? '10⁻²' : p === 1e-3 ? '10⁻³' : p === 1e-4 ? '10⁻⁴' : p === 1e-5 ? '10⁻⁵' : '10⁻⁶'}
            </text>
          </g>
        ))}

        {/* x 轴刻度 */}
        {T_STEPS.filter((_, i) => i % 3 === 0).map((t) => (
          <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize="9" fill="#5A6B85" fontFamily="monospace">
            {t >= 1000 ? `${t / 1000}K` : t}
          </text>
        ))}

        {/* 当前 T 竖线 */}
        <line x1={x(T)} x2={x(T)} y1={PAD_T} y2={H - PAD_B} stroke="rgba(230,237,247,0.35)" strokeDasharray="3 3" />

        {CFGS.map((c) => {
          const pts = T_STEPS.map((t) => `${x(t)},${y(Math.pow(1 - c.k / c.E, t))}`).join(' ')
          return (
            <g key={c.id}>
              <polyline points={pts} fill="none" stroke={c.hex} strokeWidth="2" opacity="0.9" />
              <circle cx={x(T)} cy={y(Math.pow(1 - c.k / c.E, T))} r="4" fill={c.hex} />
            </g>
          )
        })}
      </svg>

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 mb-5 text-[11px] font-mono">
        {CFGS.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: c.hex }} />
            <span style={{ color: c.hex }}>{c.name}</span>
            <span className="text-fg-dim">
              {c.E}→{c.k}（1/{Math.round(c.E / c.k)}）
            </span>
          </span>
        ))}
      </div>

      <Slider
        label="观察窗口 T（每个专家被抽到的机会次数，对数刻度）"
        value={ti}
        min={0}
        max={T_STEPS.length - 1}
        onChange={setTi}
        display={`${T.toLocaleString()} tokens`}
      />

      {/* 三家数据卡 */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {CFGS.map((c) => {
          const never = Math.pow(1 - c.k / c.E, T)
          const active = ((c.k + c.shared) / c.E) * 100
          const visits = (T * c.k) / c.E
          return (
            <div
              key={c.id}
              className="rounded-lg border bg-raised/40 p-4"
              style={{ borderColor: `${c.hex}44` }}
            >
              <div className="font-semibold text-sm mb-2" style={{ color: c.hex }}>
                {c.name}
              </div>
              <Row k="专家 / 每 token" v={`${c.E} → ${c.k} + ${c.shared} 共享`} />
              <Row k="每次参与率" v={`${active.toFixed(2)}%`} />
              <Row k="T 窗口期望访问" v={visits.toFixed(1)} />
              <Row
                k="从未被选中的期望占比"
                v={never < 1e-4 ? '< 0.01%' : `${(never * 100).toFixed(2)}%`}
              />
              <p className="text-[11px] text-fg-dim leading-relaxed mt-2.5">{c.fix}</p>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {T <= 256 ? (
          <>
            窗口还很短，三条曲线都在 10% 以上 —— 这就是<span className="text-fg">冷启动期</span>。
            稀疏度最激进的 V4.1 Flash（1/64）掉得最慢，
            所以它对稳定手段的依赖也最重：<span className="text-v4">Single-Pass mHC</span> 的流形约束残差在这里是必需品，不是装饰。
          </>
        ) : T <= 8192 ? (
          <>
            过渡区。注意两条紫橙线（1/56、1/51）已经掉到可以忽略的水平，而 V4.1 Flash 还要再等一两个数量级。
            「同样的稀疏化目标，不同家给出的稳定代价不同」 —— 这张图就是这个意思。
          </>
        ) : (
          <>
            窗口足够长之后，三家都不再有「专家吃白饭」的问题，差异转移到另一件事上：
            <span className="text-fg">每次前向真正参与计算的专家比例</span>
            （K3 2.01% · Qwen3.8 2.15% · V4.1 Flash 1.82%）。
            这个数才是推理成本的分母，也是三家敢把专家数往上堆的底气。
          </>
        )}
      </p>

      <Note>
        解析假设：每个 token 从 E 个专家里均匀随机取 k 个（即负载均衡已成立），于是单个专家被落选的概率为 1 − k/E，
        T 次独立后仍未被选中的概率为 (1 − k/E)^T。真实路由有偏好、有共享专家、有 batch 相关性，曲线只用来比较量级与趋势。
      </Note>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px] py-0.5">
      <span className="font-mono text-fg-dim">{k}</span>
      <span className="font-mono text-fg-muted tabular-nums">{v}</span>
    </div>
  )
}
