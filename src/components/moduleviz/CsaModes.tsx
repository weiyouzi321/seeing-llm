'use client'

import { useState, useMemo } from 'react'
import { Slider, Seg, Stat, Note, mulberry32, gauss } from '@/components/opviz/ui'

/**
 * CSA2 —— Full / Reindex / Reuse 三模式，以及它们为什么必须间隔出现
 *
 * 演示逻辑：
 *   · 每个候选 key 有一个「真实重要性」w（固定种子，与模型无关）
 *   · Reindex 层用 Sparse Indexer 打分 s = w + σ·噪声，只保留 top-k
 *     —— 打分有噪声，所以必然会漏掉一些真正重要的 key
 *   · Reuse 层沿用上一次 Reindex 的选集，一个也不重挑
 *   · Full 层看全部
 *
 * 要让人一眼看到的结论：一旦某个 key 在 Reindex 那一步被漏掉，
 * 后面整段 Reuse 层都看不见它 —— 这就是 Reindex 间隔必须调的原因。
 */

const L = 96 // 候选 key 数
const LAYERS = 20

type Strategy = 'every4' | 'once' | 'full'
type Mode = 'Full' | 'Reindex' | 'Reuse'

export function CsaModes() {
  const [k, setK] = useState(8) // 稀疏挑选的 top-k
  const [sigma, setSigma] = useState(0.35) // 打分噪声
  const [strategy, setStrategy] = useState<Strategy>('every4')

  // ---- 真实重要性 + 每层独立的索引器噪声（确定性首屏） ----
  const { truth, noise } = useMemo(() => {
    const r = mulberry32(20260914)
    const truth = Array.from({ length: L }, () => r())
    const noise: number[][] = Array.from({ length: LAYERS }, () =>
      Array.from({ length: L }, () => gauss(r)),
    )
    return { truth, noise }
  }, [])

  const topK = useMemo(() => {
    return [...truth.keys()]
      .sort((a, b) => truth[b] - truth[a])
      .slice(0, k)
  }, [truth, k])

  const { rows, lost } = useMemo(() => {
    let cur: Set<number> | null = null
    const rows: { mode: Mode; sel: Set<number> }[] = []
    for (let i = 0; i < LAYERS; i++) {
      let mode: Mode
      if (strategy === 'full') mode = 'Full'
      else if (strategy === 'once') mode = i === 0 ? 'Reindex' : 'Reuse'
      else mode = i % 4 === 0 ? 'Reindex' : 'Reuse'

      if (mode === 'Full') {
        cur = new Set([...Array(L).keys()])
      } else if (mode === 'Reindex') {
        const score = truth.map((w, j) => w + sigma * noise[i][j])
        cur = new Set(
          [...score.keys()].sort((a, b) => score[b] - score[a]).slice(0, k),
        )
      }
      rows.push({ mode, sel: new Set(cur!) })
    }
    // 最后一段中被彻底看不见的重要 key（按最后一个选集统计）
    const last = rows[rows.length - 1].sel
    const lost = topK.filter((j) => !last.has(j))
    return { rows, lost }
  }, [truth, noise, topK, k, sigma, strategy])

  const covRow = (sel: Set<number>) => {
    const hit = topK.filter((j) => sel.has(j)).length
    return hit / topK.length
  }

  const covs = rows.map((r) => covRow(r.sel))
  const avg = covs.reduce((a, b) => a + b, 0) / covs.length
  const worst = Math.min(...covs)
  const worstAt = covs.indexOf(worst) + 1
  const fullLayers = rows.filter((r) => r.mode === 'Full').length

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">
        {LAYERS} 层 × {L} 个候选 key · 每层挑 top-{k}
      </div>
      <div className="font-mono text-sm mb-5">
        策略 <span className="text-neon font-semibold">{STRATEGY_LABEL[strategy]}</span>
        <span className="text-fg-dim"> · 索引器噪声 σ = {sigma.toFixed(2)}</span>
      </div>

      {/* 候选 key 的重要性剖面 */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow">候选 key · 真实重要性剖面</span>
        <span className="font-mono text-[10px] text-fg-dim">
          描边 = 真正应该被看到的 top-{k}
        </span>
      </div>
      <div className="flex items-end gap-px h-12 mb-1">
        {truth.map((w, j) => (
          <div
            key={j}
            className="flex-1 rounded-t-[2px]"
            style={{
              height: `${10 + w * 90}%`,
              background: topK.includes(j) ? '#FB923C' : 'rgba(120,160,255,0.22)',
              boxShadow: topK.includes(j) ? '0 0 8px -2px #FB923C' : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-fg-dim mb-5">
        <span>key 0</span>
        <span>key {L - 1}</span>
      </div>

      {/* 层 × key 热力图 */}
      <div className="space-y-[3px] mb-4">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-fg-dim w-7 text-right shrink-0">
              L{i + 1}
            </span>
            <div className="flex-1 flex gap-px">
              {Array.from({ length: L }, (_, j) => {
                const on = r.sel.has(j)
                const important = topK.includes(j)
                const fill = !on
                  ? important
                    ? 'rgba(251,146,60,0.18)'
                    : 'rgba(255,255,255,0.03)'
                  : important
                  ? '#FB923C'
                  : MODE_COLOR[r.mode]
                return (
                  <div
                    key={j}
                    className="flex-1 h-[9px] rounded-[1px]"
                    style={{
                      background: fill,
                      boxShadow: on && important ? '0 0 6px -1px #FB923C' : undefined,
                    }}
                  />
                )
              })}
            </div>
            <span
              className="font-mono text-[9px] w-12 text-right shrink-0 tabular-nums"
              style={{ color: MODE_TEXT[r.mode] }}
            >
              {r.mode === 'Full' ? 'FULL' : r.mode === 'Reindex' ? 'REIDX' : 'REUSE'}
            </span>
            <span className="font-mono text-[9px] w-9 text-right shrink-0 tabular-nums text-fg-muted">
              {(covs[i] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* 控制区 */}
      <div className="grid md:grid-cols-2 gap-x-6 mb-5">
        <Slider label="top-k（稀疏预算）" value={k} min={4} max={24} onChange={setK} display={`${k} / ${L}`} />
        <Slider
          label="索引器打分噪声 σ"
          value={sigma}
          min={0}
          max={100}
          onChange={(v) => setSigma(v / 100)}
          display={sigma.toFixed(2)}
        />
      </div>
      <div className="mb-5">
        <Seg
          options={[
            { v: 'every4' as Strategy, label: '每 4 层 Reindex' },
            { v: 'once' as Strategy, label: '只 Reindex 一次' },
            { v: 'full' as Strategy, label: '全 Full' },
          ]}
          value={strategy}
          onChange={setStrategy}
        />
      </div>

      {/* 结论数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat k="平均覆盖率" v={`${(avg * 100).toFixed(1)}%`} sub="真正重要的 key 被看到的比例" color="#FB923C" />
        <Stat k="最差层" v={`L${worstAt} · ${(worst * 100).toFixed(0)}%`} sub="一只被漏，整段看不见" />
        <Stat k="当前漏掉" v={`${lost.length} / ${k}`} sub="最后一层视野外的关键 key" color="#F87171" />
        <Stat
          k="Full 层占比"
          v={fullLayers === 0 ? '0 / 20' : '20 / 20'}
          sub={fullLayers === 0 ? '靠 Reindex 保底' : '无稀疏，最贵'}
        />
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        {strategy === 'full' ? (
          <>
            切到全 Full：覆盖率 100%，但每个层都在做 <span className="text-neon">O(L²)</span> 的全量注意力 ——
            这正是 CSA2 要拆掉的成本。<span className="text-fg">稀疏不是免费的</span>，代价就在下面两种模式里。
          </>
        ) : strategy === 'once' ? (
          <>
            只 Reindex 一次：后面 <span className="text-fg">19 层全在复用同一份选集</span>。
            那一次打分漏掉的 key，整段都回不来 —— 把 σ 拉到 0.6 以上看看覆盖率怎么塌。
            这就是 <span className="text-v4">Reindex 间隔</span>必须反复调的原因：太稀漏得多，太密就没省下算力。
          </>
        ) : (
          <>
            每 4 层 Reindex：橙色格能看见的比例在每次重挑时会跳一下，然后又缓慢下降 ——
            因为 Reuse 期间上下文已经在往前走了。
            σ 调大（索引器看不准）时，最差层往往出现在 block 末尾，正是「漏选 + 不重挑」叠加的位置。
          </>
        )}
      </p>

      <Note>
        演示用简化定义：key 的真实重要性是固定随机数，索引器打分为 重要性 + σ·高斯噪声；
        覆盖率 = 该层选集 ∩ 真实 top-k 的比例。不代表论文中的具体打分网络，只为了把「漏选不可找回」这条性质讲清楚。
      </Note>
    </div>
  )
}

const MODE_COLOR: Record<Mode, string> = {
  Full: 'rgba(34,211,238,0.75)',
  Reindex: 'rgba(34,211,238,0.55)',
  Reuse: 'rgba(34,211,238,0.3)',
}

const MODE_TEXT: Record<Mode, string> = {
  Full: '#67E8F9',
  Reindex: '#22D3EE',
  Reuse: '#5A6B85',
}

const STRATEGY_LABEL: Record<Strategy, string> = {
  every4: '每 4 层 Reindex',
  once: '只 Reindex 一次',
  full: '全 Full',
}
