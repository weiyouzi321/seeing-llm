'use client'

import { useMemo, useState } from 'react'
import { Btn, Note, Seg, Slider, Stat, gauss, mulberry32 } from './ui'

/* ============================================================
   1. 激活函数曲线 —— relu
   ============================================================ */

type FnKey = 'relu' | 'gelu' | 'silu' | 'leaky'

const FNS: Record<FnKey, { label: string; color: string; f: (x: number) => number; note: string }> = {
  relu: {
    label: 'ReLU',
    color: '#22D3EE',
    f: (x) => (x > 0 ? x : 0),
    note: '负数硬截断为 0 —— 一半神经元直接静默，这是最廉价的稀疏',
  },
  gelu: {
    label: 'GELU',
    color: '#A78BFA',
    f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    note: '「按概率随机置零」的平滑版，GPT / BERT 系列默认',
  },
  silu: {
    label: 'SiLU',
    color: '#FB923C',
    f: (x) => x / (1 + Math.exp(-x)),
    note: 'x·σ(x)，0 附近平滑且允许小负值，LLaMA / Qwen 在用',
  },
  leaky: {
    label: 'LeakyReLU',
    color: '#94A3B8',
    f: (x) => (x > 0 ? x : 0.1 * x),
    note: '负数留 0.1 斜率，避免神经元彻底「死亡」',
  },
}

const FN_KEYS: FnKey[] = ['relu', 'gelu', 'silu', 'leaky']

const W = 640
const H = 300
const PL = 46
const PR = 622
const PT = 18
const PB = 262
const X0 = -4
const X1 = 4
const Y0 = -1.5
const Y1 = 4.5

const sx = (x: number) => PL + ((x - X0) / (X1 - X0)) * (PR - PL)
const sy = (y: number) => PB - ((y - Y0) / (Y1 - Y0)) * (PB - PT)

export function ActivationCurves() {
  const [on, setOn] = useState<Record<FnKey, boolean>>({
    relu: true,
    gelu: true,
    silu: true,
    leaky: false,
  })
  const active = FN_KEYS.filter((k) => on[k])

  const paths = useMemo(() => {
    const xs: number[] = []
    for (let i = 0; i <= 160; i++) xs.push(X0 + ((X1 - X0) * i) / 160)
    return FN_KEYS.map((k) => ({
      k,
      d: xs
        .map((x, i) => `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(FNS[k].f(x)).toFixed(1)}`)
        .join(' '),
    }))
  }, [])

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">激活函数对比 · x ∈ [−4, 4]</div>
      <p className="text-sm text-fg-muted mb-4 leading-relaxed">
        ReLU 的价值不在「曲线好看」，而在它把一半输入压成精确的 0 ——
        这是 MoE 之外最常见的稀疏来源。后面的 GELU / SiLU 都在试图缓解它「一刀切」的问题。
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="激活函数曲线">
        {/* 网格 */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((x) => (
          <line key={`vx${x}`} x1={sx(x)} y1={PT} x2={sx(x)} y2={PB} stroke="#1B2740" strokeWidth={x === 0 ? 1.4 : 1} />
        ))}
        {[-1, 0, 1, 2, 3, 4].map((y) => (
          <line key={`hy${y}`} x1={PL} y1={sy(y)} x2={PR} y2={sy(y)} stroke="#1B2740" strokeWidth={y === 0 ? 1.4 : 1} />
        ))}
        {/* 刻度 */}
        {[-4, -2, 0, 2, 4].map((x) => (
          <text key={`tx${x}`} x={sx(x)} y={PB + 16} fill="#5A6B85" fontSize="10" fontFamily="monospace" textAnchor="middle">
            {x}
          </text>
        ))}
        {[-1, 0, 1, 2, 3, 4].map((y) => (
          <text key={`ty${y}`} x={PL - 8} y={sy(y) + 3} fill="#5A6B85" fontSize="10" fontFamily="monospace" textAnchor="end">
            {y}
          </text>
        ))}
        {/* 曲线 */}
        {paths.map((p) =>
          on[p.k] ? (
            <path
              key={p.k}
              d={p.d}
              fill="none"
              stroke={FNS[p.k].color}
              strokeWidth="2.2"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${FNS[p.k].color}66)` }}
            />
          ) : null
        )}
      </svg>

      {/* 开关 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FN_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOn({ ...on, [k]: !on[k] })}
            className="px-3 py-1.5 rounded-lg font-mono text-xs transition border"
            style={{
              color: on[k] ? FNS[k].color : '#5A6B85',
              borderColor: on[k] ? `${FNS[k].color}66` : '#1B2740',
              background: on[k] ? `${FNS[k].color}1A` : 'transparent',
            }}
          >
            {FNS[k].label}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {active.map((k) => (
          <div key={k} className="flex gap-3 text-xs">
            <span className="w-20 shrink-0 font-mono" style={{ color: FNS[k].color }}>
              {FNS[k].label}
            </span>
            <span className="text-fg-muted leading-relaxed">{FNS[k].note}</span>
          </div>
        ))}
      </div>

      <Note>
        标准正态输入下 ReLU 输出为 0 的比例 ≈ 50%。Kimi K3 的 FFN 用 SiTU-GLU 取代朴素 ReLU，
        正是为了在保留稀疏的同时拿到平滑梯度。
      </Note>
    </div>
  )
}

/* ============================================================
   2. Softmax 温度 —— softmax
   ============================================================ */

const TOKENS = [
  { t: '模型', logit: 3.0 },
  { t: '参数', logit: 2.3 },
  { t: '注意', logit: 1.9 },
  { t: '的', logit: 1.2 },
  { t: '力', logit: 0.5 },
  { t: '一个', logit: -0.4 },
  { t: '是', logit: -1.1 },
  { t: '。', logit: -2.0 },
]

export function SoftmaxTemp() {
  const [T, setT] = useState(1)

  const { probs, entropy, top1, n90 } = useMemo(() => {
    const z = TOKENS.map((o) => o.logit / T)
    const m = Math.max(...z)
    const e = z.map((v) => Math.exp(v - m))
    const s = e.reduce((a, b) => a + b, 0)
    const p = e.map((v) => v / s)
    const H = -p.reduce((a, v) => a + (v > 1e-12 ? v * Math.log2(v) : 0), 0)
    const sorted = [...p].sort((a, b) => b - a)
    let acc = 0
    let n = 0
    for (const v of sorted) {
      acc += v
      n += 1
      if (acc >= 0.9) break
    }
    return { probs: p, entropy: H, top1: Math.max(...p), n90: n }
  }, [T])

  const maxIdx = probs.indexOf(top1)

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">温度 T 如何重塑分布</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        同一组 logits，只改一个除法 —— T 越小越贪心，越大越均匀。
        这是所有采样策略背后的唯一旋钮。
      </p>

      <Slider
        label="温度 T"
        value={T}
        min={0.1}
        max={4}
        step={0.05}
        onChange={setT}
        display={T.toFixed(2)}
      />

      <div className="space-y-1.5 mb-5">
        {TOKENS.map((o, i) => {
          const p = probs[i]
          const isTop = i === maxIdx
          return (
            <div key={o.t} className="flex items-center gap-3">
              <span
                className="w-12 text-right font-mono text-xs shrink-0"
                style={{ color: isTop ? '#22D3EE' : '#8A9BB8' }}
              >
                {o.t}
              </span>
              <div className="flex-1 h-5 bg-raised rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${Math.max(p * 100, 0.4)}%`,
                    background: isTop
                      ? 'linear-gradient(90deg, rgba(34,211,238,0.35), #22D3EE)'
                      : 'linear-gradient(90deg, rgba(138,155,184,0.18), rgba(138,155,184,0.5))',
                  }}
                />
              </div>
              <span className="w-16 text-right font-mono text-xs text-fg-dim tabular-nums">
                {(p * 100).toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat k="最大概率" v={`${(top1 * 100).toFixed(1)}%`} sub="T→0 时趋于 100%" color="#22D3EE" />
        <Stat k="分布熵" v={`${entropy.toFixed(2)} bit`} sub="log2(8)=3.00 为均匀" color="#A78BFA" />
        <Stat k="覆盖 90% 质量" v={`${n90} / 8`} sub="核采样的候选集大小" color="#FB923C" />
      </div>

      <Note>
        实现时必须先减去 max 再取 exp：exp(1000) 在 fp32 下直接是 inf，
        inf/inf 得到 nan，整个训练就此崩掉。
      </Note>
    </div>
  )
}

/* ============================================================
   3. 归一化 —— layer-norm
   ============================================================ */

const D_VEC = 12

type NormView = 'raw' | 'ln' | 'rms'

function makeVec(seed: number) {
  const r = mulberry32(seed)
  return Array.from({ length: D_VEC }, () => gauss(r) * 2 + 3)
}

function statsOf(v: number[]) {
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  const varr = v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length
  return { mean, std: Math.sqrt(varr) }
}

export function NormDemo() {
  const [seed, setSeed] = useState(20260914)
  const [view, setView] = useState<NormView>('raw')

  const raw = useMemo(() => makeVec(seed), [seed])
  const ln = useMemo(() => {
    const { mean, std } = statsOf(raw)
    return raw.map((x) => (x - mean) / Math.sqrt(std ** 2 + 1e-5))
  }, [raw])
  const rms = useMemo(() => {
    const ms = raw.reduce((a, b) => a + b * b, 0) / raw.length
    return raw.map((x) => x / Math.sqrt(ms + 1e-5))
  }, [raw])

  const cur = view === 'raw' ? raw : view === 'ln' ? ln : rms
  const maxAbs = Math.max(...cur.map(Math.abs), 1e-6)
  const sRaw = statsOf(raw)
  const sLn = statsOf(ln)
  const sRms = statsOf(rms)

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">一个 12 维向量穿过归一化层</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        原始向量刻意取了 <span className="font-mono text-fg">均值 3、标准差 2</span> 的偏移分布 ——
        这样才看得出归一化到底改了什么。
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Seg<NormView>
          value={view}
          onChange={setView}
          options={[
            { v: 'raw', label: '原始' },
            { v: 'ln', label: 'LayerNorm' },
            { v: 'rms', label: 'RMSNorm' },
          ]}
        />
        <Btn onClick={() => setSeed(Math.floor(Math.random() * 1e9))} ghost>
          换一组随机值
        </Btn>
      </div>

      {/* 条形：以 0 为中心，正负分列 */}
      <div className="relative h-40 mb-2">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-line" />
        <div className="absolute inset-0 flex items-end justify-center gap-1.5">
          {cur.map((v, i) => {
            const h = (Math.abs(v) / maxAbs) * 68
            const pos = v >= 0
            return (
              <div key={i} className="flex flex-col justify-end h-full" style={{ width: 28 }}>
                <div className="flex flex-col justify-end" style={{ height: '50%' }}>
                  {pos && (
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${h}%`,
                        background: 'linear-gradient(180deg, #22D3EE, rgba(34,211,238,0.25))',
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col justify-start" style={{ height: '50%' }}>
                  {!pos && (
                    <div
                      className="w-full rounded-b"
                      style={{
                        height: `${h}%`,
                        background: 'linear-gradient(0deg, #FB923C, rgba(251,146,60,0.25))',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between font-mono text-[10px] text-fg-dim mb-5">
        <span>−{maxAbs.toFixed(2)}</span>
        <span>维度 1 … {D_VEC}</span>
        <span>+{maxAbs.toFixed(2)}</span>
      </div>

      {/* 三种视图的统计量并排 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { k: '原始', s: sRaw, c: '#8A9BB8' },
          { k: 'LayerNorm', s: sLn, c: '#22D3EE' },
          { k: 'RMSNorm', s: sRms, c: '#A78BFA' },
        ].map((r) => (
          <div
            key={r.k}
            className="rounded-lg border px-3 py-2.5"
            style={{
              borderColor: view === (r.k === '原始' ? 'raw' : r.k === 'LayerNorm' ? 'ln' : 'rms') ? `${r.c}66` : '#1B2740',
              background: 'rgba(16,24,40,0.4)',
            }}
          >
            <div className="eyebrow mb-1.5" style={{ color: r.c }}>{r.k}</div>
            <div className="font-mono text-xs text-fg-muted">μ = {r.s.mean.toFixed(3)}</div>
            <div className="font-mono text-xs text-fg-muted">σ = {r.s.std.toFixed(3)}</div>
          </div>
        ))}
      </div>

      <Note>
        RMSNorm 不减均值（μ 保持 3 附近），只按均方根缩放 —— 少一次减法和一次求和，
        效果几乎无损。现代 LLM（LLaMA / Qwen / DeepSeek / Kimi）几乎全部改用 RMSNorm。
      </Note>
    </div>
  )
}

/* ============================================================
   4. Dropout —— dropout
   ============================================================ */

const CELLS = 128

export function DropoutDemo() {
  const [p, setP] = useState(0.5)
  const [seed, setSeed] = useState(4242)
  const [training, setTraining] = useState(true)

  const vals = useMemo(() => {
    const r = mulberry32(11)
    return Array.from({ length: CELLS }, () => 0.25 + r() * 0.75)
  }, [])

  const mask = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: CELLS }, () => r() > p)
  }, [seed, p])

  const active = training && p > 0
  const out = vals.map((v, i) => (!active || mask[i] ? v / (active ? 1 - p : 1) : 0))
  const meanRaw = vals.reduce((a, b) => a + b, 0) / CELLS
  const meanOut = out.reduce((a, b) => a + b, 0) / CELLS
  const kept = out.filter((v) => v > 0).length

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">Inverted Dropout · {CELLS} 个元素</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        关键不在「随机置零」，而在留下的元素要除以 (1−p) —— 这样输出的期望值和输入一致，
        推理时才可以整个模块直通。看下面的均值：它应该几乎不动。
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-5">
        <Slider
          label="丢弃概率 p"
          value={p}
          min={0}
          max={0.9}
          step={0.05}
          onChange={setP}
          display={p.toFixed(2)}
        />
        <div className="flex items-end gap-2 pb-1">
          <Seg<'train' | 'eval'>
            value={training ? 'train' : 'eval'}
            onChange={(v) => setTraining(v === 'train')}
            options={[
              { v: 'train', label: '训练模式' },
              { v: 'eval', label: '推理模式' },
            ]}
          />
          <Btn onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>重新掷骰</Btn>
        </div>
      </div>

      <div
        className="grid gap-[3px] mb-5 p-3 rounded-lg border border-line bg-void/60"
        style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
      >
        {out.map((v, i) => {
          const dropped = active && v === 0
          const intensity = Math.min(v / 4, 1)
          return (
            <div
              key={i}
              className="aspect-square rounded-[2px] transition-all duration-200"
              style={{
                background: dropped
                  ? 'rgba(90,107,133,0.10)'
                  : `rgba(34,211,238,${0.18 + intensity * 0.8})`,
                boxShadow: dropped ? 'none' : `0 0 6px -2px rgba(34,211,238,${intensity})`,
              }}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat k="保留元素" v={`${kept} / ${CELLS}`} sub={active ? `期望 ${Math.round(CELLS * (1 - p))}` : '推理期全部保留'} color="#22D3EE" />
        <Stat k="输入均值" v={meanRaw.toFixed(4)} sub="原始尺度" />
        <Stat k="输出均值" v={meanOut.toFixed(4)} sub="应与输入均值接近" color="#FB923C" />
      </div>

      <Note>
        若不除以 (1−p)，p=0.5 时输出均值会腰斩 —— 训练看到的激活尺度与推理不一致，
        模型表现会明显掉档。这个「顺手一除」就是 inverted dropout 的全部秘密。
      </Note>
    </div>
  )
}

/* ============================================================
   5. 交叉熵 —— cross-entropy
   ============================================================ */

export function LossDemo() {
  const [p, setP] = useState(0.3)
  const loss = -Math.log(p)

  const pts: string[] = []
  for (let i = 1; i <= 200; i++) {
    const q = i / 200
    const y = Math.min(-Math.log(q), 5)
    pts.push(`${i === 0 ? 'M' : 'L'}${(46 + q * 576).toFixed(1)},${(262 - (y / 5) * 244).toFixed(1)}`)
  }

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">loss = −log p(正确 token)</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        这条曲线决定了训练的动力：模型越确信答案，loss 越接近 0；一旦猜错还很自信，
        loss 会飞到天上去 —— 这就是为什么梯度容易炸。
      </p>

      <Slider
        label="模型给正确 token 的概率 p"
        value={p}
        min={0.01}
        max={0.99}
        step={0.01}
        onChange={setP}
        display={p.toFixed(2)}
      />

      <svg viewBox="0 0 640 300" className="w-full" role="img" aria-label="交叉熵曲线">
        {[0, 1, 2, 3, 4, 5].map((y) => (
          <g key={y}>
            <line x1={46} y1={262 - (y / 5) * 244} x2={622} y2={262 - (y / 5) * 244} stroke="#1B2740" />
            <text x={38} y={262 - (y / 5) * 244 + 3} fill="#5A6B85" fontSize="10" fontFamily="monospace" textAnchor="end">
              {y}
            </text>
          </g>
        ))}
        <path d={pts.join(' ')} fill="none" stroke="#22D3EE" strokeWidth="2.4" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.4))' }} />
        <line
          x1={46 + p * 576}
          y1={262}
          x2={46 + p * 576}
          y2={262 - (Math.min(loss, 5) / 5) * 244}
          stroke="#FB923C"
          strokeDasharray="4 3"
        />
        <circle
          cx={46 + p * 576}
          cy={262 - (Math.min(loss, 5) / 5) * 244}
          r="5"
          fill="#FB923C"
          style={{ filter: 'drop-shadow(0 0 8px #FB923C)' }}
        />
        {[0.2, 0.4, 0.6, 0.8, 1].map((q) => (
          <text key={q} x={46 + q * 576} y={280} fill="#5A6B85" fontSize="10" fontFamily="monospace" textAnchor="middle">
            {q.toFixed(1)}
          </text>
        ))}
      </svg>

      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stat k="当前 loss" v={loss.toFixed(3)} color="#FB923C" />
        <Stat k="p = 0.01" v="4.605" sub="自信地猜错" />
        <Stat k="随机猜（160K 词表）" v="11.98" sub="ln 160000，训练起点" color="#A78BFA" />
      </div>

      <Note>
        Kimi K3 词表 160K：训练第一步模型纯瞎猜，loss ≈ ln(160000) ≈ 11.98。
        之后降到 2 以下才算真正学会了语言结构。
      </Note>
    </div>
  )
}
