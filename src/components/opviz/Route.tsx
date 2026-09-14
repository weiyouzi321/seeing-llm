'use client'

import { useState } from 'react'
import { Btn, Note, Slider, Stat, gauss, mulberry32 } from './ui'

const E = 32 // 图上专家数（真实模型是几百到近千，道理相同）

interface St {
  pop: number[]
  load: number[]
  batches: number
}

function initPop(): number[] {
  const r = mulberry32(20260910)
  return Array.from({ length: E }, () => gauss(r))
}

function initSt(): St {
  return { pop: initPop(), load: Array.from({ length: E }, () => 0), batches: 0 }
}

/** 推进一步（纯函数：随机噪声由外部预生成并传入，便于连续多批复用） */
function step(s: St, k: number, tokens: number, aux: boolean, noise: number[], offset: number): St {
  const nl = [...s.load]
  const np = [...s.pop]
  const mean = np.reduce((a, b) => a + b, 0) / E
  const batch = Array.from({ length: E }, () => 0)
  const expected = Math.max((tokens * k) / E, 1e-9)

  let ptr = offset
  for (let t = 0; t < tokens; t++) {
    const scores = np.map((v) => v + noise[ptr++] * 0.9)
    const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a])
    for (let j = 0; j < k; j++) {
      const e = order[j]
      batch[e] += 1
      nl[e] += 1
    }
  }

  for (let e = 0; e < E; e++) {
    const rel = batch[e] / expected
    const drift = 0.9 * (rel - 1) // 富者愈富
    np[e] = aux ? np[e] + drift - 0.6 * (np[e] - mean) : np[e] + drift
  }

  return { pop: np, load: nl, batches: s.batches + 1 }
}

/**
 * MoE 路由 —— 核心教学点不是「怎么选 top-k」，
 * 而是「为什么必须加负载均衡损失」：不加的话富者愈富，
 * 几批之后大半专家永远收不到 token，等于白养。
 */
export function MoeRouting() {
  const [st, setSt] = useState<St>(initSt)
  const [k, setK] = useState(2)
  const [tokens, setTokens] = useState(96)
  const [aux, setAux] = useState(true)

  const load = st.load
  const total = load.reduce((a, b) => a + b, 0)
  const maxLoad = Math.max(...load, 1)
  const dead = load.filter((v) => v === 0).length
  const alive = E - dead

  // 基尼系数：0 = 完全均衡，越接近 1 = token 越集中
  const gini = (() => {
    if (total === 0) return 0
    const s = [...load].sort((a, b) => a - b)
    let w = 0
    for (let i = 0; i < E; i++) w += (i + 1) * s[i]
    return (2 * w) / (E * total) - (E + 1) / E
  })()

  function send(n: number) {
    // 噪声在 setState 外预生成，保证 updater 是纯函数
    const noise = Array.from({ length: n * tokens * E }, () => gauss(Math.random))
    setSt((prev) => {
      let cur = prev
      for (let i = 0; i < n; i++) cur = step(cur, k, tokens, aux, noise, i * tokens * E)
      return cur
    })
  }

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">MoE 路由模拟 · {E} 个专家 · 已投喂 {st.batches} 批</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        「选 top-k」只是几行代码。真正的难题是
        <span className="text-fg">路由塌缩</span>：
        稍微有点优势的专家会吸引更多 token、变得更强、再吸引更多 —— 几批之后，
        大部分专家彻底饿死。开关下面的「负载均衡损失」，看它能不能救回来。
      </p>

      <div className="grid sm:grid-cols-3 gap-6">
        <Slider
          label="top-k"
          value={k}
          min={1}
          max={8}
          step={1}
          onChange={setK}
          display={`${k} / ${E} = ${((k / E) * 100).toFixed(1)}%`}
        />
        <Slider
          label="每批 token 数"
          value={tokens}
          min={16}
          max={256}
          step={16}
          onChange={setTokens}
          display={String(tokens)}
        />
        <div className="pb-1 flex items-end">
          <Btn onClick={() => setAux(!aux)} ghost={aux}>
            {aux ? '负载均衡：开' : '负载均衡：关'}
          </Btn>
        </div>
      </div>

      {/* 专家负载热力图 */}
      <div className="eyebrow mb-2">专家负载（颜色越亮 = 收到的 token 越多）</div>
      <div className="grid gap-[3px] mb-4" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
        {load.map((v, i) => {
          const t = total ? v / maxLoad : 0
          return (
            <div
              key={i}
              className="aspect-[2/1] rounded-[2px] flex items-center justify-center font-mono text-[9px] transition-all duration-300"
              style={{
                background: v === 0 ? 'rgba(90,107,133,0.07)' : `rgba(34,211,238,${0.1 + t * 0.9})`,
                color: v === 0 ? '#3A4A63' : t > 0.6 ? '#05070D' : '#5A6B85',
                boxShadow: t > 0.85 ? '0 0 12px -2px rgba(34,211,238,0.9)' : 'none',
              }}
              title={`专家 ${i}：${v} tokens`}
            >
              {v}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Btn onClick={() => send(1)}>投喂一批 token</Btn>
        <Btn onClick={() => send(10)} ghost>
          连续 10 批
        </Btn>
        <Btn onClick={() => setSt(initSt())} ghost>
          重置
        </Btn>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          k="存活专家"
          v={`${alive} / ${E}`}
          sub={dead ? `${dead} 个已饿死` : '暂无饿死'}
          color={dead > E / 4 ? '#FB923C' : '#22D3EE'}
        />
        <Stat k="基尼系数" v={gini.toFixed(3)} sub="0 = 均衡，越大越集中" color="#A78BFA" />
        <Stat
          k="最忙 / 平均"
          v={total ? (maxLoad / (total / E)).toFixed(2) : '—'}
          sub="理想值 1.00"
          color="#FB923C"
        />
        <Stat k="稀疏度" v={`${((k / E) * 100).toFixed(1)}%`} sub={`每 token 激活 ${k} / ${E}`} />
      </div>

      <Note>
        真实配比：Kimi K3 是 896 个专家选 16（+2 共享）≈ 1/56；
        Qwen3.8 是 512 选 10（+1 共享）；DeepSeek V4.1 Flash 是 384 选 6（+1 共享）= 1/64。
        专家总数涨了近百倍，激活数却只涨了几倍 —— 稀疏度一路走高，
        这就是「参数量 ≠ 计算量」的全部含义。
      </Note>
    </div>
  )
}
