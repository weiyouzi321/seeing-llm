'use client'

import { useState, useMemo } from 'react'
import { Slider, Seg, Stat, Btn, Note, mulberry32, gauss } from '@/components/opviz/ui'

/**
 * Delta 规则 —— 「写入前先擦除」到底救了什么
 *
 * 两条更新规则对比（随机非正交 key，所以一定有串扰）：
 *   纯累加：  S ← S + v ⊗ k                     状态只增不减
 *   Delta：   S ← S + (v − S·k) ⊗ k / |k|²     先把 k 在当前状态里读到的内容减掉，再写新的
 *
 * 关键差别不在「能不能记住」，而在「能不能被覆写」：
 * 纯累加再写一次同一个 key，读出来是新旧值的混合；
 * Delta 规则写出来是精确的新值，而且对其它 pair 的扰动极小。
 */

const D = 24 // 状态维度（玩具尺度，够看清楚性质）
const N = 8 // 存的 key-value 对数

type Rule = 'accum' | 'delta'

export function DeltaRule() {
  const [rule, setRule] = useState<Rule>('accum')
  const [epochs, setEpochs] = useState(1)
  const [clicks, setClicks] = useState(0)

  // ---- 玩具数据：确定性生成 ----
  const { K, V } = useMemo(() => {
    const r = mulberry32(31415)
    const K = Array.from({ length: N }, () => unit(Array.from({ length: D }, () => gauss(r))))
    const V = Array.from({ length: N }, () => unit(Array.from({ length: D }, () => gauss(r))))
    return { K, V }
  }, [])

  // ---- 覆写目标：每次点击换一个新的目标值 ----
  const target = useMemo(
    () => unit(Array.from({ length: D }, () => gauss(mulberry32(2718 + clicks * 977)))),
    [clicks],
  )

  // ---- 计算：两种规则各算一份，方便直接对比 ----
  const result = useMemo(
    () => runWrite(K, V, target, clicks, rule, epochs),
    [K, V, target, clicks, rule, epochs],
  )
  const refDelta = useMemo(
    () => (rule === 'accum' ? runWrite(K, V, target, clicks, 'delta', epochs) : null),
    [K, V, target, clicks, rule, epochs],
  )

  const pair0 = result.cos[0]
  const others = result.cos.slice(1)
  const othersAvg = others.reduce((a, b) => a + b, 0) / others.length

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">
        状态 S ∈ R^({D}×{D}) · 存 {N} 对 (k, v)
      </div>
      <div className="font-mono text-sm mb-5">
        更新规则 <span className="text-neon font-semibold">{RULE_LABEL[rule]}</span>
        <span className="text-fg-dim">
          {' '}
          · 写入轮数 {epochs}
          {clicks > 0 ? ` · 已覆写第 1 条 ${clicks} 次` : ''}
        </span>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6 mb-6">
        {/* 状态矩阵热力图 */}
        <div>
          <div className="eyebrow mb-2">状态矩阵 S</div>
          <div className="space-y-px">
            {result.S.map((row, i) => (
              <div key={i} className="flex gap-px">
                {row.map((v, j) => (
                  <div
                    key={j}
                    className="flex-1 h-[9px] rounded-[1px]"
                    style={cellStyle(v, result.maxAbs)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-fg-dim">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(34,211,238,0.85)' }} />
              正
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(167,139,250,0.85)' }} />
              负
            </span>
            <span>|S|_F = {result.frob.toFixed(2)}</span>
          </div>
        </div>

        {/* 逐对检索质量 */}
        <div>
          <div className="eyebrow mb-2">取出质量 · cos( S·k , 目标 v )</div>
          <div className="space-y-1.5">
            {result.cos.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-fg-dim w-8 shrink-0">
                  {i === 0 && clicks > 0 ? 'k0*' : `k${i}`}
                </span>
                <div className="flex-1 h-3 rounded-sm bg-white/[0.03] overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${Math.max(0, c) * 100}%`,
                      background:
                        c > 0.95
                          ? 'linear-gradient(90deg, rgba(34,211,238,0.4), #22D3EE)'
                          : c > 0.7
                          ? 'linear-gradient(90deg, rgba(251,146,60,0.4), #FB923C)'
                          : 'linear-gradient(90deg, rgba(248,113,113,0.4), #F87171)',
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] w-10 text-right tabular-nums text-fg-muted">
                  {c.toFixed(3)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Stat
              k="第 1 条取出"
              v={pair0.toFixed(3)}
              sub={clicks > 0 ? '覆写之后' : '刚写完'}
              color={pair0 > 0.95 ? '#22D3EE' : '#F87171'}
            />
            <Stat k="其余均值" v={othersAvg.toFixed(3)} sub="串扰造成的退化" />
          </div>
        </div>
      </div>

      {/* 控制区 */}
      <div className="grid md:grid-cols-2 gap-x-6 mb-4">
        <div>
          <Seg
            options={[
              { v: 'accum' as Rule, label: '纯累加' },
              { v: 'delta' as Rule, label: 'Delta 规则' },
            ]}
            value={rule}
            onChange={setRule}
          />
        </div>
        <Slider
          label={rule === 'delta' ? '写入轮数（多轮收敛到最小二乘解）' : '写入轮数（累加只会越来越满）'}
          value={epochs}
          min={1}
          max={8}
          onChange={setEpochs}
          display={`${epochs} 轮`}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Btn onClick={() => setClicks((c) => c + 1)}>覆写第 1 条 →</Btn>
        <Btn ghost onClick={() => setClicks(0)}>
          重置
        </Btn>
      </div>

      {/* 对照数据 */}
      {refDelta && (
        <div className="rounded-lg border border-line bg-raised/40 px-4 py-3 mb-4">
          <div className="eyebrow mb-1.5">同条件下的 Delta 规则</div>
          <div className="font-mono text-xs text-fg-muted">
            第 1 条取出 <span className="text-neon">{refDelta.cos[0].toFixed(3)}</span>
            <span className="text-fg-dim"> · </span>
            其余均值{' '}
            <span className="text-fg">
              {(refDelta.cos.slice(1).reduce((a, b) => a + b, 0) / (N - 1)).toFixed(3)}
            </span>
            <span className="text-fg-dim"> · |S|_F {refDelta.frob.toFixed(2)}</span>
          </div>
        </div>
      )}

      <p className="text-sm text-fg-muted leading-relaxed">
        {clicks === 0 ? (
          <>
            两边都先把 {N} 对写进去。纯累加的状态范数会随写入次数持续增长 —— 这正是「只增不减」的含义；
            Delta 规则每轮都会把当前读出来的内容减掉再写，多轮之后收敛到{' '}
            <span className="text-fg">最小二乘意义下的最佳拟合</span>，范数保持在合理范围。
            点「覆写第 1 条」看真正的差别。
          </>
        ) : rule === 'accum' ? (
          <>
            覆写后再读第 1 条，得到的是<span className="text-fg">新旧值的加权混合</span> —— 旧内容没有被删掉，只是被稀释。
            要让它的占比降到 10% 以下，得继续重复写入同一个 key，代价是状态范数继续膨胀、其余各条的串扰也跟着变糟。
            这就是 Gated DeltaNet 论文里说的「<span className="text-fg">状态被无关历史污染</span>」。
          </>
        ) : (
          <>
            Delta 规则覆写一次，第 1 条就精确读出新值：<span className="text-neon">先把旧的减掉，再写新的</span>。
            而且注意「其余均值」几乎没动 —— 因为本次更新只沿着 k₀ 的方向动了状态。
            Qwen3.8 把它放在 <span className="text-qwen">92 层里的 69 层（3/4）</span>，剩下 1/4 仍由 Gated Attention 兜底。
          </>
        )}
      </p>

      <Note>
        玩具设定：状态维度 d = {D}，{N} 对随机高斯 key（归一化，但互相不正交 —— 串扰正是从这里来）、随机单位 value。
        数字只用于展示性质（可覆写性 vs 状态膨胀），不代表真实模型中的数值。
      </Note>
    </div>
  )
}

/* ---------------- 线性代数小工具 ---------------- */

function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function unit(a: number[]): number[] {
  const n = Math.sqrt(dot(a, a)) || 1
  return a.map((x) => x / n)
}

function matVec(S: number[][], x: number[]): number[] {
  return S.map((row) => dot(row, x))
}

function addOuter(S: number[][], u: number[], v: number[], scale: number): number[][] {
  return S.map((row, i) => row.map((s, j) => s + scale * u[i] * v[j]))
}

function writePair(S: number[][], k: number[], v: number[], rule: Rule): number[][] {
  if (rule === 'accum') {
    return addOuter(S, v, k, 1)
  }
  const kk = dot(k, k) || 1
  const r = matVec(S, k)
  const residual = v.map((x, i) => x - r[i])
  return addOuter(S, residual, k, 1 / kk)
}

function runWrite(
  K: number[][],
  V: number[][],
  target: number[],
  clicks: number,
  rule: Rule,
  epochs: number,
) {
  let S = Array.from({ length: D }, () => Array.from({ length: D }, () => 0))
  for (let e = 0; e < epochs; e++) {
    for (let i = 0; i < N; i++) S = writePair(S, K[i], V[i], rule)
  }
  // 覆写：把第 1 条的 value 换成 target，写若干次
  for (let c = 0; c < clicks; c++) {
    S = writePair(S, K[0], target, rule)
  }

  const expect = clicks > 0 ? [target, ...V.slice(1)] : V
  const cos = expect.map((v, i) => {
    const r = matVec(S, K[i])
    return cosSim(r, v)
  })

  let sq = 0
  let maxAbs = 1e-9
  for (const row of S) {
    for (const v of row) {
      sq += v * v
      maxAbs = Math.max(maxAbs, Math.abs(v))
    }
  }

  return { S, cos, frob: Math.sqrt(sq), maxAbs }
}

function cosSim(a: number[], b: number[]): number {
  const na = Math.sqrt(dot(a, a))
  const nb = Math.sqrt(dot(b, b))
  if (na < 1e-9 || nb < 1e-9) return 0
  return dot(a, b) / (na * nb)
}

function cellStyle(v: number, maxAbs: number): React.CSSProperties {
  const t = Math.min(1, Math.abs(v) / maxAbs)
  const a = 0.08 + t * 0.77
  return {
    background:
      v >= 0 ? `rgba(34,211,238,${a})` : `rgba(167,139,250,${a})`,
  }
}

const RULE_LABEL: Record<Rule, string> = {
  accum: 'S ← S + v ⊗ k（纯累加）',
  delta: 'S ← S + (v − S·k) ⊗ k / |k|²',
}
