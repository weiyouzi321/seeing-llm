'use client'

import { Fragment, useMemo, useState } from 'react'
import type { IoStep } from '@/lib/ops'
import { Btn, Note, Slider, Stat } from './ui'

/* ============================================================
   1. 张量形状链路 —— 所有 viz = 'shape' 的通用底座
   ============================================================ */

export function ShapeFlow({ io }: { io: IoStep[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {io.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && (
            <div className="self-center px-1 text-fg-dim font-mono text-sm select-none">→</div>
          )}
          <div className="panel px-4 py-3 min-w-[130px]">
            <div className="eyebrow mb-1.5">{s.label}</div>
            <div className="font-mono text-sm text-neon">{s.shape}</div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/* ============================================================
   2. GQA 分组 —— multihead-attention / gqa
   ============================================================ */

const H = 16 // Q 头数（图上固定 16，便于看清分组）
const PALETTE = ['#22D3EE', '#A78BFA', '#FB923C', '#34D399', '#F472B6', '#FACC15', '#60A5FA', '#F87171']

export function GqaHeads() {
  const [G, setG] = useState(4)
  const perGroup = H / G

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">多头注意力 · Q 头与 KV 头的配对</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        多头不会增加计算量，但会成倍放大 KV Cache ——
        因为每个 Q 头都要配一份 K/V。GQA 的做法是让一组 Q 头共用一对 K/V：
        质量几乎不掉，缓存直接按比例砍。
      </p>

      <Slider
        label="KV 头数 G（Q 头固定 16）"
        value={G}
        min={1}
        max={16}
        step={1}
        onChange={(v) => setG(v)}
        display={`${H} Q / ${G} KV`}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <Btn onClick={() => setG(16)}>MHA 16/16</Btn>
        <Btn onClick={() => setG(4)}>GQA 16/4</Btn>
        <Btn onClick={() => setG(1)} ghost>
          MQA 16/1
        </Btn>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: G }, (_, g) => {
            const c = PALETTE[g % PALETTE.length]
            return (
              <div key={g} className="flex flex-col items-center gap-1.5">
                <div className="flex flex-col gap-[3px]">
                  {Array.from({ length: perGroup }, (_, i) => (
                    <div
                      key={i}
                      className="w-7 rounded-[3px] flex items-center justify-center font-mono text-[9px]"
                      style={{
                        height: perGroup > 4 ? 12 : 20,
                        color: c,
                        background: `${c}1F`,
                        border: `1px solid ${c}59`,
                      }}
                    >
                      Q
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px" style={{ background: `${c}66` }} />
                <div
                  className="w-7 h-8 rounded-[3px] flex items-center justify-center font-mono text-[9px] font-semibold"
                  style={{
                    color: '#05070D',
                    background: c,
                    boxShadow: `0 0 14px -3px ${c}`,
                  }}
                  title={`KV 头 ${g}`}
                >
                  KV
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <Stat k="每组 Q 头数" v={String(perGroup)} sub="H / G" />
        <Stat k="KV 缓存（相对 MHA）" v={`${((G / H) * 100).toFixed(1)}%`} sub="G / H" color="#FB923C" />
        <Stat k="省下" v={`${(H / G).toFixed(0)}×`} sub={`1 ÷ ${(G / H).toFixed(3)}`} color="#22D3EE" />
        <Stat k="档位" v={G === H ? 'MHA' : G === 1 ? 'MQA' : 'GQA'} sub={G === H ? '1:1 不共享' : G === 1 ? '全部共享' : `${perGroup}:1`} color="#A78BFA" />
      </div>

      <Note>
        Qwen3.8 的 Gated Attention 用 64 Q / 4 KV —— 比例 16:1，比图上的 MQA 还极端一档，
        代价是把 RoPE 只作用在 64 维上。Kimi K3 的 Gated MLA 走另一条路：
        不共享头，而是把所有头的 KV 压进一个 3584 维的 latent，官方口径 KV Cache 削减 75%。
      </Note>
    </div>
  )
}

/* ============================================================
   3. 卷积滑窗 —— conv2d
   ============================================================ */

const N = 7 // 输入 7×7
const K = 3 // 卷积核 3×3
const OUT = N - K + 1 // 输出 5×5

type KernelKey = 'vertical' | 'horizontal' | 'blur' | 'sharpen'

const KERNELS: Record<KernelKey, { label: string; k: number[][]; note: string }> = {
  vertical: {
    label: '垂直边缘',
    k: [
      [1, 0, -1],
      [1, 0, -1],
      [1, 0, -1],
    ],
    note: '左右差分：只在竖直边界处响应强烈',
  },
  horizontal: {
    label: '水平边缘',
    k: [
      [1, 1, 1],
      [0, 0, 0],
      [-1, -1, -1],
    ],
    note: '上下差分：对水平边界敏感',
  },
  blur: {
    label: '模糊',
    k: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
    note: '全 1/9 求平均：抹平高频，输出接近原值',
  },
  sharpen: {
    label: '锐化',
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    note: '中心放大、四周抑制：放大与邻域的差异',
  },
}

/** 一张 7×7 的竖边图：左半 0.2，右半 0.85 */
const IMG: number[][] = Array.from({ length: N }, (_, r) =>
  Array.from({ length: N }, (_, c) => (c < 3 ? 0.2 : c > 3 ? 0.85 : 0.52))
)

export function ConvSweep() {
  const [kk, setKk] = useState<KernelKey>('vertical')
  const [idx, setIdx] = useState(7)

  const { out, maxAbs } = useMemo(() => {
    const k = KERNELS[kk].k
    const o: number[][] = Array.from({ length: OUT }, () => Array.from({ length: OUT }, () => 0))
    for (let r = 0; r < OUT; r++) {
      for (let c = 0; c < OUT; c++) {
        let s = 0
        for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) s += k[i][j] * IMG[r + i][c + j]
        o[r][c] = s
      }
    }
    return { out: o, maxAbs: Math.max(...o.flat().map(Math.abs), 1e-6) }
  }, [kk])

  const r = Math.floor(idx / OUT)
  const c = idx % OUT
  const val = out[r][c]

  const cell = (v: number, max: number) => {
    const t = Math.min(Math.abs(v) / max, 1)
    const col = v >= 0 ? `rgba(34,211,238,${0.08 + t * 0.9})` : `rgba(251,146,60,${0.08 + t * 0.9})`
    return col
  }

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">卷积滑窗 · 7×7 输入 / 3×3 核 / 5×5 输出</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        卷积的全部直觉就一句：<span className="text-fg">局部性 + 权值共享</span>。
        同一个 3×3 核在图像上滑一遍，每个位置做一次加权求和。
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(KERNELS) as KernelKey[]).map((key) => (
          <Btn key={key} onClick={() => setKk(key)} ghost={kk !== key}>
            {KERNELS[key].label}
          </Btn>
        ))}
      </div>

      <div className="grid md:grid-cols-[auto_auto_auto] gap-8 justify-items-center">
        {/* 输入 */}
        <div>
          <div className="eyebrow mb-2 text-center">输入 7×7</div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${N}, 26px)` }}>
            {IMG.flatMap((row, ri) =>
              row.map((v, ci) => {
                const inWin = ri >= r && ri < r + K && ci >= c && ci < c + K
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="rounded-[2px] flex items-center justify-center font-mono text-[9px]"
                    style={{
                      height: 26,
                      background: `rgba(138,155,184,${0.06 + v * 0.5})`,
                      outline: inWin ? '2px solid #22D3EE' : 'none',
                      color: inWin ? '#E6EDF7' : '#5A6B85',
                    }}
                  >
                    {v.toFixed(1).slice(1)}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 核 */}
        <div className="self-center">
          <div className="eyebrow mb-2 text-center">卷积核</div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(3, 34px)' }}>
            {KERNELS[kk].k.flatMap((row, i) =>
              row.map((v, j) => (
                <div
                  key={`${i}-${j}`}
                  className="h-[34px] rounded-[2px] flex items-center justify-center font-mono text-[10px] border border-line"
                  style={{
                    background: v > 0 ? 'rgba(34,211,238,0.18)' : v < 0 ? 'rgba(251,146,60,0.18)' : 'rgba(16,24,40,0.6)',
                    color: v > 0 ? '#22D3EE' : v < 0 ? '#FB923C' : '#5A6B85',
                  }}
                >
                  {Math.abs(v) < 0.01 ? '0' : v > 0 ? (Number.isInteger(v) ? v : '+') : Number.isInteger(v) ? v : '−'}
                </div>
              ))
            )}
          </div>
          <div className="font-mono text-[10px] text-fg-dim mt-2 max-w-[120px] text-center leading-snug">
            {KERNELS[kk].note}
          </div>
        </div>

        {/* 输出 */}
        <div>
          <div className="eyebrow mb-2 text-center">输出 5×5</div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${OUT}, 26px)` }}>
            {out.flatMap((row, ri) =>
              row.map((v, ci) => (
                <div
                  key={`o${ri}-${ci}`}
                  className="h-[26px] rounded-[2px] flex items-center justify-center font-mono text-[9px]"
                  style={{
                    background: cell(v, maxAbs),
                    outline: ri === r && ci === c ? '2px solid #E6EDF7' : 'none',
                    color: '#05070D',
                    fontWeight: ri === r && ci === c ? 700 : 400,
                  }}
                >
                  {Math.abs(v) < 0.005 ? '0' : v.toFixed(1)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Slider
          label="滑窗位置（输出坐标，行优先）"
          value={idx}
          min={0}
          max={OUT * OUT - 1}
          step={1}
          onChange={setIdx}
          display={`(${r}, ${c})`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat k="当前输出值" v={val.toFixed(3)} color={val >= 0 ? '#22D3EE' : '#FB923C'} />
        <Stat k="输出范围" v={`${Math.min(...out.flat()).toFixed(2)} … ${Math.max(...out.flat()).toFixed(2)}`} />
        <Stat k="参数量" v="9" sub="与图像大小无关（权值共享）" color="#A78BFA" />
      </div>

      <Note>
        对比一下：如果把这层换成全连接，7×7 → 5×5 需要 2401×25 ≈ 6 万个参数，
        而且换个分辨率就彻底失效。卷积只用 9 个参数、且对任意尺寸通用 —— 这就是它统治视觉的原因。
      </Note>
    </div>
  )
}
