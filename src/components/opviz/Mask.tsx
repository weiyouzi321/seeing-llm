'use client'

import { useMemo, useState } from 'react'
import { Btn, Note, Slider, Stat } from './ui'

/**
 * 因果掩码 —— sdpa / causal-attention
 *
 * scores 用一组确定性的数（不随机），保证静态预渲染与客户端一致。
 */
function scoreAt(i: number, j: number) {
  return Math.sin((i + 1) * 1.7 + (j + 1) * 0.9) * 2.2 + (j === i ? 1.4 : 0)
}

function softmaxRow(row: number[], keep: boolean[]) {
  const m = Math.max(...row.filter((_, j) => keep[j]), -Infinity)
  const e = row.map((v, j) => (keep[j] ? Math.exp(v - m) : 0))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / s)
}

export function CausalMask({ initialMask = false }: { initialMask?: boolean }) {
  const [L, setL] = useState(8)
  const [maskOn, setMaskOn] = useState(initialMask)

  const rows = useMemo(
    () =>
      Array.from({ length: L }, (_, i) => {
        const raw = Array.from({ length: L }, (_, j) => scoreAt(i, j))
        const keep = Array.from({ length: L }, (_, j) => (maskOn ? j <= i : true))
        return { raw, keep, p: softmaxRow(raw, keep) }
      }),
    [L, maskOn]
  )

  const used = maskOn ? (L * (L + 1)) / 2 : L * L
  const pct = (used / (L * L)) * 100
  const lastRow = rows[L - 1].p

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">注意力矩阵 · 行 = query 位置，列 = key 位置</div>
      <p className="text-sm text-fg-muted mb-5 leading-relaxed">
        {maskOn ? (
          <>
            上三角被填成 −inf，softmax 后自然变成 0 —— 第 i 个 token 只看得到前 i 个。
            注意：被遮掉的那部分<span className="text-fg">不是「不用算」，而是「算完再扔」</span>，
            所以 FlashAttention 这类融合算子的价值就在于连算都省掉。
          </>
        ) : (
          <>
            不加掩码时每个 query 都能看到全部 key —— 这在编码器（BERT、V4.1 的 20 层编码器）里是对的，
            但在自回归生成里等于偷看答案。
          </>
        )}
      </p>

      <div className="grid sm:grid-cols-2 gap-6 items-end mb-5">
        <Slider label="序列长度 L" value={L} min={4} max={16} step={1} onChange={setL} display={`${L} × ${L}`} />
        <div className="pb-1">
          <Btn onClick={() => setMaskOn(!maskOn)} ghost={maskOn}>
            {maskOn ? '移除因果掩码' : '加上因果掩码'}
          </Btn>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 mb-5">
        <div
          className="grid gap-[2px] min-w-max"
          style={{ gridTemplateColumns: `repeat(${L}, minmax(22px, 1fr))`, maxWidth: 560 }}
        >
          {rows.flatMap((row, i) =>
            row.p.map((p, j) => {
              const off = !row.keep[j]
              return (
                <div
                  key={`${i}-${j}`}
                  className="aspect-square rounded-[2px] flex items-center justify-center font-mono text-[8px] transition-all duration-200"
                  style={{
                    background: off
                      ? 'rgba(90,107,133,0.07)'
                      : `rgba(34,211,238,${Math.min(p * 1.9, 1)})`,
                    color: off ? '#3A4A63' : p > 0.45 ? '#05070D' : '#5A6B85',
                    outline: i === L - 1 ? '1px solid rgba(251,146,60,0.55)' : 'none',
                  }}
                  title={`attn[${i}][${j}] = ${off ? '0 (masked)' : p.toFixed(3)}`}
                >
                  {off ? '' : p >= 0.095 ? p.toFixed(2).slice(1) : ''}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 最后一行：最后一个 token 看到了什么 */}
      <div className="eyebrow mb-2">最后一个 token 的注意力分布（图中橙色框那一行）</div>
      <div className="flex items-end gap-[3px] h-16 mb-1">
        {lastRow.map((p, j) => (
          <div key={j} className="flex-1 flex flex-col justify-end h-full">
            <div
              className="w-full rounded-t transition-all duration-200"
              style={{
                height: `${Math.max(p * 100, 1.5)}%`,
                background: p > 0 ? 'linear-gradient(180deg,#FB923C,rgba(251,146,60,0.25))' : 'rgba(90,107,133,0.12)',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-fg-dim mb-5">
        <span>位置 0</span>
        <span>每行概率和 = 1</span>
        <span>位置 {L - 1}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat k="参与计算的元素" v={`${used} / ${L * L}`} color="#22D3EE" />
        <Stat k="占比" v={`${pct.toFixed(1)}%`} sub={maskOn ? '≈ 一半，另一半被遮' : '全算'} color="#FB923C" />
        <Stat
          k="计算量级"
          v="O(L²)"
          sub={maskOn ? '掩码省的是数值，不省复杂度' : '随长度平方增长'}
          color="#A78BFA"
        />
      </div>

      <Note>
        因果掩码 ≠ padding 掩码：前者防止偷看未来（自回归必须），
        后者屏蔽补齐的无效位置（batch 内变长必须）。两者可以同时叠加在同一个 scores 上。
      </Note>
    </div>
  )
}
