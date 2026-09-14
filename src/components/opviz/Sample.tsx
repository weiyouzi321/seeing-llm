'use client'

import { useMemo, useState } from 'react'
import { Btn, Note, Slider, Stat } from './ui'

const CAND = [
  { t: '模型', logit: 3.2 },
  { t: '参数', logit: 2.6 },
  { t: '注意', logit: 2.1 },
  { t: '的', logit: 1.5 },
  { t: '力', logit: 0.9 },
  { t: '一个', logit: 0.3 },
  { t: '是', logit: -0.2 },
  { t: '训练', logit: -0.7 },
  { t: '上下文', logit: -1.2 },
  { t: '梯度', logit: -1.8 },
  { t: '。', logit: -2.4 },
  { t: '<unk>', logit: -3.5 },
]

export function SampleDemo() {
  const [k, setK] = useState(0)
  const [pTop, setPTop] = useState(0.9)
  const [hist, setHist] = useState<number[]>(() => CAND.map(() => 0))
  const [last, setLast] = useState<string | null>(null)

  const { probs, keep, nKeep, mass } = useMemo(() => {
    const m = Math.max(...CAND.map((c) => c.logit))
    const e = CAND.map((c) => Math.exp(c.logit - m))
    const s = e.reduce((a, b) => a + b, 0)
    const pr = e.map((v) => v / s)

    const order = pr.map((_, i) => i).sort((a, b) => pr[b] - pr[a])
    let acc = 0
    const keepP = new Set<number>()
    for (const i of order) {
      // 核采样规则：累计概率在加入自己之前若已 ≥ p，就把自己及之后全丢掉
      if (acc < pTop) keepP.add(i)
      acc += pr[i]
    }
    const keepK = new Set(k > 0 ? order.slice(0, k) : order)

    const keepArr = CAND.map((_, i) => (k > 0 ? keepK.has(i) && keepP.has(i) : keepP.has(i)))
    const mk = keepArr.reduce((a, v, i) => a + (v ? pr[i] : 0), 0)
    return { probs: pr, keep: keepArr, nKeep: keepArr.filter(Boolean).length, mass: mk }
  }, [k, pTop])

  function draw() {
    const idxs: number[] = []
    for (let i = 0; i < CAND.length; i++) if (keep[i]) idxs.push(i)
    if (!idxs.length) return
    const total = idxs.reduce((a, i) => a + probs[i], 0)
    const next = [...hist]
    let picked = idxs[0]
    for (let n = 0; n < 30; n++) {
      let r = Math.random() * total
      for (const i of idxs) {
        r -= probs[i]
        if (r <= 0) {
          next[i] += 1
          picked = i
          break
        }
      }
    }
    setHist(next)
    setLast(CAND[picked].t)
  }

  const maxProb = Math.max(...probs)
  const totalDraws = hist.reduce((a, b) => a + b, 0)

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">Top-k / Top-p 截断 · 12 个候选 token</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        两个旋钮可以叠加：先按 Top-p 划出「概率核」，再按 Top-k 硬性限数量。
        调它们就是在<span className="text-fg">敢不敢冒险</span>之间选位置。
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Slider
          label="Top-k（0 = 关闭）"
          value={k}
          min={0}
          max={CAND.length}
          step={1}
          onChange={setK}
          display={k === 0 ? '关闭' : `k = ${k}`}
        />
        <Slider
          label="Top-p（核采样）"
          value={pTop}
          min={0.05}
          max={1}
          step={0.01}
          onChange={setPTop}
          display={pTop >= 0.999 ? '关闭（=1.0）' : `p = ${pTop.toFixed(2)}`}
        />
      </div>

      {/* 候选条 */}
      <div className="space-y-1.5 mb-5">
        {CAND.map((c, i) => {
          const on = keep[i]
          return (
            <div key={c.t} className="flex items-center gap-3">
              <span
                className="w-14 text-right font-mono text-xs shrink-0 truncate"
                style={{ color: on ? '#E6EDF7' : '#3A4A63', textDecoration: on ? 'none' : 'line-through' }}
              >
                {c.t}
              </span>
              <div className="flex-1 h-5 bg-raised rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${Math.max((probs[i] / maxProb) * 100, 0.5)}%`,
                    background: on
                      ? 'linear-gradient(90deg, rgba(34,211,238,0.3), #22D3EE)'
                      : 'repeating-linear-gradient(45deg, rgba(90,107,133,0.18) 0 4px, transparent 4px 8px)',
                  }}
                />
              </div>
              <span
                className="w-16 text-right font-mono text-xs tabular-nums"
                style={{ color: on ? '#8A9BB8' : '#3A4A63' }}
              >
                {(probs[i] * 100).toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat k="候选集大小" v={`${nKeep} / ${CAND.length}`} color="#22D3EE" />
        <Stat k="保留概率质量" v={`${(mass * 100).toFixed(2)}%`} sub="重归一化后重新变回 1" color="#FB923C" />
        <Stat k="熵上界" v={`${Math.log2(Math.max(nKeep, 1)).toFixed(2)} bit`} sub="log2(候选数)" />
        <Stat k="采样次数" v={String(totalDraws)} sub={last ? `最近抽到「${last}」` : '尚未采样'} color="#A78BFA" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Btn onClick={draw}>采样 30 次</Btn>
        <Btn onClick={() => { setHist(CAND.map(() => 0)); setLast(null) }} ghost>
          清空
        </Btn>
      </div>

      {/* 采样直方图 */}
      <div className="flex items-end gap-[3px] h-20 border-b border-line">
        {hist.map((n, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full">
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: totalDraws ? `${(n / Math.max(...hist)) * 100}%` : '0%',
                background: keep[i] ? 'linear-gradient(180deg,#A78BFA,rgba(167,139,250,0.25))' : 'rgba(90,107,133,0.2)',
              }}
              title={`${CAND[i].t}: ${n}`}
            />
          </div>
        ))}
      </div>

      <Note>
        把 p 调到 0.1、k 调到 1，采样结果会几乎恒定 —— 那就是贪心解码。
        把 p 提到 0.95 以上，长尾里的生僻 token 开始出现，文本更有新意但也更容易跑题。
      </Note>
    </div>
  )
}
