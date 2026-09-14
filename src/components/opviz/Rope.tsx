'use client'

import { useState } from 'react'
import { Btn, Note, Slider, Stat } from './ui'

const CX = 140
const CY = 140
const R = 100
const PHI = 0.9 // q 与 k 在「位置相同」时的固有夹角

/**
 * RoPE 的精髓：把 Q/K 的每两个维度看成平面上的点，按位置旋转。
 * 旋转后做内积，结果只与相对位置有关：
 *   ⟨R_m q, R_n k⟩ = cos(φ + (n − m)·θ)
 * 这里只画一个频率平面；真实实现是 d/2 个不同频率的平面叠加。
 */
export function RopeDial() {
  const [m, setM] = useState(3)
  const [n, setN] = useState(7)
  const [theta, setTheta] = useState(0.5)

  const aq = m * theta
  const an = PHI + n * theta
  const dot = Math.cos(an - aq)
  const rel = n - m

  const px = (a: number, rr: number) => CX + rr * Math.cos(a)
  const py = (a: number, rr: number) => CY - rr * Math.sin(a)

  // 位置刻度：0 … 24
  const ticks = Array.from({ length: 25 }, (_, j) => j * theta)

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">旋转位置编码 · 单个频率平面</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        RoPE 不「加」位置向量，而是把 Q/K 旋转一个与位置成正比的角度。
        妙处在于：旋转后内积只取决于<span className="text-fg">相对位置</span>，
        绝对位置自动被消掉。
      </p>

      <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
        <svg viewBox="0 0 280 280" className="w-full max-w-[280px]" role="img" aria-label="RoPE 旋转示意">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1B2740" strokeWidth="1.5" />
          <line x1={CX - R - 14} y1={CY} x2={CX + R + 14} y2={CY} stroke="#1B2740" />
          <line x1={CX} y1={CY - R - 14} x2={CX} y2={CY + R + 14} stroke="#1B2740" />

          {/* 位置刻度 */}
          {ticks.map((a, j) => (
            <circle
              key={j}
              cx={px(a, R)}
              cy={py(a, R)}
              r={j === m ? 4 : 2}
              fill={j === m ? '#22D3EE' : '#2A3A5C'}
            />
          ))}

          {/* q 向量 */}
          <line
            x1={CX}
            y1={CY}
            x2={px(aq, R)}
            y2={py(aq, R)}
            stroke="#22D3EE"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.7))' }}
          />
          {/* k 向量 */}
          <line
            x1={CX}
            y1={CY}
            x2={px(an, R)}
            y2={py(an, R)}
            stroke="#FB923C"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.7))' }}
          />

          {/* 相对夹角弧 */}
          <path
            d={arc(aq, an, R * 0.42)}
            fill="none"
            stroke="#A78BFA"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          <text x={px(aq, R + 18)} y={py(aq, R + 18) + 4} fill="#22D3EE" fontSize="11" fontFamily="monospace">
            q @ {m}
          </text>
          <text x={px(an, R + 18)} y={py(an, R + 18) + 4} fill="#FB923C" fontSize="11" fontFamily="monospace">
            k @ {n}
          </text>
        </svg>

        <div>
          <Slider label="query 位置 m" value={m} min={0} max={24} step={1} onChange={setM} display={String(m)} />
          <Slider label="key 位置 n" value={n} min={0} max={24} step={1} onChange={setN} display={String(n)} />
          <Slider
            label="每位置旋转角 θ"
            value={theta}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setTheta}
            display={`${theta.toFixed(2)} rad`}
          />

          <div className="flex flex-wrap gap-3 mb-4">
            <Btn
              onClick={() => {
                setM(m + 1)
                setN(n + 1)
              }}
            >
              两者同时 +1
            </Btn>
            <Btn onClick={() => { setM(3); setN(7); setTheta(0.5) }} ghost>
              重置
            </Btn>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat k="相对位置 n − m" v={String(rel)} color="#A78BFA" />
            <Stat k="q · k（旋转后）" v={dot.toFixed(4)} color="#22D3EE" />
          </div>
        </div>
      </div>

      <Note>
        点「两者同时 +1」：q 和 k 各自都在转，但内积纹丝不动 —— 这就是相对位置编码。
        Qwen3.8 的 Gated Attention 只把 RoPE 作用在 64 维（而非全部 256 维），
        其余维度留给内容本身，是刻意做的取舍。
      </Note>
    </div>
  )
}

/** 生成从角 a1 到 a2 的圆弧路径（SVG 坐标系 y 轴向下） */
function arc(a1: number, a2: number, r: number): string {
  let d = a2 - a1
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  const steps = 24
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = a1 + (d * i) / steps
    pts.push(`${i === 0 ? 'M' : 'L'}${(CX + r * Math.cos(a)).toFixed(1)},${(CY - r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}
