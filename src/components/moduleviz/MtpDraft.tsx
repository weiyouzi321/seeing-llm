'use client'

import { useState, useMemo } from 'react'
import { Slider, Stat, Btn, Note, mulberry32 } from '@/components/opviz/ui'

/**
 * MTP / 投机解码 —— 草稿长度该选几
 *
 * 一轮的成本与收益（ widely used 的一阶近似）：
 *   收益   E[接受数] = Σ_{j=1..γ} α^j = α(1−α^γ)/(1−α)  再 +1（主模型总会额外吐出一个）
 *   成本   草稿 γ·c  +  主模型验证 1 + β·γ（批量前向比 γ 次单步便宜得多，β ≈ 0.05）
 *   加速比 = 收益 / 成本，以「不用投机」的 1 token / 1.0 单位成本为基准
 *
 * 要让人记住的两条：
 *   1. 接受率高时，最优 γ 是一个中间值 —— 不是越长越好
 *   2. 接受率低 Draft-friendly 场景之外，γ 稍大就直接跌破 1.0，比不用还慢
 */

const MAX_G = 10
const BETA = 0.05

export function MtpDraft() {
  const [alpha, setAlpha] = useState(0.7) // 每个草稿 token 的接受概率
  const [cost, setCost] = useState(0.1) // 草稿模型相对主模型单步的成本
  const [gamma, setGamma] = useState(5) // 草稿长度
  const [round, setRound] = useState(0) // 演示轮次（确定性）

  const stats = useMemo(() => {
    const rows = Array.from({ length: MAX_G }, (_, i) => {
      const g = i + 1
      const acc = alpha >= 0.999 ? g : (alpha * (1 - Math.pow(alpha, g))) / (1 - alpha)
      const tokens = acc + 1
      const c = g * cost + 1 + BETA * g
      return { g, tokens, cost: c, speed: tokens / c }
    })
    let best = rows[0]
    for (const r of rows) if (r.speed > best.speed) best = r
    const cur = rows[gamma - 1]
    return { rows, best, cur }
  }, [alpha, cost, gamma])

  // ---- 单轮演示：草稿里哪几个被接受 ----
  const demo = useMemo(() => {
    const r = mulberry32(9021 + round * 7919)
    const marks = Array.from({ length: gamma }, () => r() < alpha)
    let accepted = 0
    for (const m of marks) {
      if (m) accepted++
      else break
    }
    return { marks, accepted, bonus: true }
  }, [alpha, gamma, round])

  const maxSpeed = Math.max(1.2, ...stats.rows.map((r) => r.speed))

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">
        草稿长度 γ = {gamma} · 单 token 接受率 α = {alpha.toFixed(2)}
      </div>
      <div className="font-mono text-sm mb-5">
        草稿成本 <span className="text-neon font-semibold">{cost.toFixed(2)}×</span>
        <span className="text-fg-dim"> 主模型单步 · 批量验证开销 β = {BETA}</span>
      </div>

      {/* 一轮示意 */}
      <div className="mb-6">
        <div className="eyebrow mb-2">第 {round + 1} 轮 · 草稿与验证结果</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {demo.marks.map((ok, i) => {
            const reached = i < demo.accepted
            const rejected = i === demo.accepted
            return (
              <span
                key={i}
                className="font-mono text-xs px-2.5 py-1.5 rounded-md border tabular-nums"
                style={{
                  borderColor: reached
                    ? 'rgba(34,211,238,0.5)'
                    : rejected
                    ? 'rgba(248,113,113,0.5)'
                    : '#1B2740',
                  background: reached
                    ? 'rgba(34,211,238,0.14)'
                    : rejected
                    ? 'rgba(248,113,113,0.12)'
                    : 'rgba(255,255,255,0.02)',
                  color: reached ? '#67E8F9' : rejected ? '#FCA5A5' : '#5A6B85',
                }}
              >
                d{i + 1}
              </span>
            )
          })}
          <span className="font-mono text-xs text-fg-dim px-1">→</span>
          <span
            className="font-mono text-xs px-2.5 py-1.5 rounded-md border"
            style={{
              borderColor: 'rgba(251,146,60,0.5)',
              background: 'rgba(251,146,60,0.12)',
              color: '#FDBA74',
            }}
          >
            +1 主模型补发
          </span>
          <span className="font-mono text-xs text-fg-muted ml-2">
            本轮出 <span className="text-neon font-semibold tabular-nums">{demo.accepted + 1}</span> 个 token
          </span>
        </div>
        <div className="mt-2">
          <Btn ghost onClick={() => setRound((r) => r + 1)}>再跑一轮 →</Btn>
        </div>
      </div>

      {/* 加速比 vs 草稿长度 */}
      <div className="eyebrow mb-2">加速比 vs 草稿长度</div>
      <div className="flex items-end gap-1.5 h-40 mb-2">
        {stats.rows.map((r) => {
          const h = (r.speed / maxSpeed) * 100
          const isCur = r.g === gamma
          const isBest = r.g === stats.best.g
          const color = r.speed < 1 ? '#F87171' : isBest ? '#22D3EE' : '#475C7E'
          return (
            <div key={r.g} className="flex-1 flex flex-col items-center justify-end h-full">
              <span
                className="font-mono text-[9px] mb-1 tabular-nums"
                style={{ color: isCur ? '#E6EDF7' : '#5A6B85' }}
              >
                {r.speed.toFixed(2)}
              </span>
              <div
                className="w-full rounded-t-[3px] transition-all duration-300"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: `linear-gradient(180deg, ${color}33, ${color})`,
                  boxShadow: isBest ? `0 0 18px -5px ${color}` : undefined,
                  outline: isCur ? '1px solid rgba(230,237,247,0.5)' : undefined,
                }}
              />
              <span className="font-mono text-[9px] text-fg-dim mt-1">{r.g}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(248,113,113,0.4)' }} />
        <span className="font-mono text-[10px] text-fg-dim">1.0 = 不用投机</span>
      </div>

      {/* 控制区 */}
      <div className="grid md:grid-cols-3 gap-x-6 mb-5">
        <Slider
          label="单 token 接受率 α"
          value={alpha}
          min={5}
          max={99}
          onChange={(v) => setAlpha(v / 100)}
          display={alpha.toFixed(2)}
        />
        <Slider label="草稿长度 γ" value={gamma} min={1} max={MAX_G} onChange={setGamma} display={`${gamma} 个`} />
        <Slider
          label="草稿模型相对成本 c"
          value={cost}
          min={2}
          max={50}
          onChange={(v) => setCost(v / 100)}
          display={`${cost.toFixed(2)}×`}
        />
      </div>

      {/* 结论数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat
          k="当前 γ 加速比"
          v={`${stats.cur.speed.toFixed(2)}×`}
          color={stats.cur.speed >= 1 ? '#22D3EE' : '#F87171'}
          sub={stats.cur.speed >= 1 ? '有赚' : '比不用还慢'}
        />
        <Stat k="最优 γ" v={`${stats.best.g} 个`} sub={`加速 ${stats.best.speed.toFixed(2)}×`} color="#22D3EE" />
        <Stat k="期望出 token" v={stats.cur.tokens.toFixed(2)} sub="每轮（含主模型补发）" />
        <Stat k="每轮成本" v={stats.cur.cost.toFixed(2)} sub="以主模型单步为 1" />
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {stats.best.g === 1 ? (
          <>
            接受率只有 {alpha.toFixed(2)} 时，草稿每多写一个都在白花钱 ——{' '}
            <span style={{ color: '#F87171' }}>最优解退化到 γ = 1</span>。这就是 DSpark 这类方案强调「置信度调度验证」的原因：
            不是固定 γ，而是按当前置信度决定这轮验证多少。任务越难、越需要现场推理，草稿质量越低，收益越难赚回来。
          </>
        ) : gamma < stats.best.g ? (
          <>
            还可以再长一点。草稿模型自己那 γ·c 的成本暂时可以摊开，主模型的批量验证几乎不随 γ 涨 ——
            所以收益端还是上升的。
          </>
        ) : gamma > stats.best.g + 2 ? (
          <>
            太长了。后面这些草稿 token 大概率等不到被接受（α^γ 衰减很快），
            却已经实实在在花了 γ·c 的草稿成本和更宽的验证 batch。
          </>
        ) : (
          <>
            大致落在最优点附近。记住这条曲线随 α 整体平移 ——{' '}
            <span className="text-fg">α 才是决定有没有收益的那一档参数</span>，γ 只是在给定 α 下挑一个局部最优。
            MTP head 的价值就在于：它既是训练端的额外监督信号，又能直接当草稿器用。
          </>
        )}
      </p>

      <Note>
        一阶近似：接受事件独立且同概率 α；主模型验证 γ+1 个位置的成本记为 1 + β·γ（β = {BETA}，体现批量前向相对于逐 token 单步的摊薄）；
        草稿模型逐个生成 γ 个 token，单步成本 c。真实系统还有调度、显存与 batch 竞争的开销，绝对值不可直接套用。
      </Note>
    </div>
  )
}
