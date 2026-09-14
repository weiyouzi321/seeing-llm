'use client'

import { useState } from 'react'
import { MODELS, expandMacro, LAYER_STYLE, type ModelId, type WallLayer } from '@/lib/models'

/**
 * 双模型层墙：把 K3 与 Qwen3.8 的层骨架逐层对齐展开。
 *
 * 核心洞察 —— 两者宏循环结构完全相同（23 × 4），
 * 差异只在「线性注意力」与「全注意力」各自怎么实现。
 * V4.1 Flash 是另一套（20 编码 + 20 解码的纵向切分），单独渲染。
 */
export function LayerWall({
  ids,
  maxLayers = 13,
}: {
  ids: ModelId[]
  maxLayers?: number
}) {
  const [active, setActive] = useState<{ m: ModelId; l: WallLayer } | null>(null)

  return (
    <div className="space-y-5">
      {ids.map((id) => {
        const m = MODELS[id]
        const isSplit = m.arch.style === 'split'
        const layers = isSplit ? [] : expandMacro(m, maxLayers)
        const shown = layers.length
        const rest = m.arch.total - shown

        return (
          <div key={id}>
            {/* 模型行头 */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className={`font-mono text-sm font-semibold ${m.textClass}`}>{m.name}</span>
              <span className="font-mono text-[11px] text-fg-dim">{m.arch.formula}</span>
            </div>

            {/* 层块序列 */}
            {isSplit ? (
              <SplitRow model={id} />
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {layers.map((l) => {
                  const st = LAYER_STYLE[l.kind]
                  const on = active?.m === id && active?.l.index === l.index
                  return (
                    <button
                      key={l.index}
                      type="button"
                      onMouseEnter={() => setActive({ m: id, l })}
                      onFocus={() => setActive({ m: id, l })}
                      onMouseLeave={() => setActive(null)}
                      onBlur={() => setActive(null)}
                      aria-label={`第 ${l.index} 层 ${l.label}`}
                      className={[
                        'w-9 h-9 rounded-md border font-mono text-[10px] leading-none',
                        'flex flex-col items-center justify-center gap-0.5',
                        'transition-all duration-150 cursor-default',
                        on ? 'scale-110 z-10' : 'hover:scale-105',
                      ].join(' ')}
                      style={{
                        background: on ? st.fill : 'rgba(255,255,255,0.025)',
                        borderColor: on ? st.stroke : 'rgba(120,160,255,0.16)',
                        boxShadow: on ? `0 0 18px -4px ${st.stroke}` : undefined,
                      }}
                    >
                      <span style={{ color: st.text }} className="font-semibold">
                        {shortLabel(l.label)}
                      </span>
                      <span className="text-[8px] text-fg-dim">{l.index}</span>
                    </button>
                  )
                })}

                {/* 省略：剩余循环次数 */}
                {rest > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="font-mono text-xs text-fg-dim px-2">···</span>
                    <span className="font-mono text-[11px] text-fg-dim">
                      同一模式重复至第 {m.arch.total} 层
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* 详情条：固定高度，避免 hover 时布局跳动 */}
      <div className="panel px-4 py-3 min-h-[64px] flex items-center">
        {active ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-xs px-2 py-0.5 rounded"
                style={{
                  background: LAYER_STYLE[active.l.kind].fill,
                  color: LAYER_STYLE[active.l.kind].text,
                }}
              >
                L{active.l.index}
              </span>
              <span className="font-semibold text-sm">{active.l.label}</span>
              <span className="text-fg-muted text-sm">{active.l.sub}</span>
              <span className={`font-mono text-xs ${MODELS[active.m].textClass}`}>
                {MODELS[active.m].name}
              </span>
            </div>
            <div className="text-fg-muted text-sm">
              {active.l.kind === 'linear'
                ? '线性注意力层：不存 KV Cache，复杂度对序列长度是线性的 —— 这是长上下文能撑到百万级的根本原因。'
                : active.l.kind === 'full'
                ? '全注意力层：每 4 层出现 1 次，负责补回线性层丢掉的表达力，也是唯一需要存 KV 的层。'
                : active.l.kind === 'dense'
                ? '稠密层：只在最前面出现 1 次，先把输入抬到隐藏维，之后全部走宏循环。'
                : active.l.kind === 'enc'
                ? '编码器层：先把整段 prompt 压成全局 KV，供后面所有解码器层复用。'
                : '解码器层：不再重新算全局 KV，直接复用编码器末层的投影结果。'}
            </div>
          </div>
        ) : (
          <span className="text-fg-dim text-sm font-mono">
            把鼠标移到任意层块上 —— 看每一层在干什么
          </span>
        )}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-mono">
        {(['linear', 'full', 'dense', 'enc', 'dec'] as const).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm border"
              style={{ background: LAYER_STYLE[k].fill, borderColor: LAYER_STYLE[k].stroke }}
            />
            <span className="text-fg-muted">{LAYER_STYLE[k].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** V4.1 Flash 的纵向切分行（编码 20 + 解码 20） */
function SplitRow({ model }: { model: ModelId }) {
  const m = MODELS[model]
  const groups = m.arch.groups ?? []
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {groups.map((g, gi) => {
        const st = LAYER_STYLE[g.kind]
        return (
          <div key={g.title} className="flex items-center gap-2">
            {gi > 0 && <span className="font-mono text-fg-dim text-sm">→</span>}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md border"
              style={{ background: st.fill, borderColor: st.stroke }}
            >
              <span className="font-mono text-xs font-semibold" style={{ color: st.text }}>
                {g.title}
              </span>
              <span className="font-mono text-[10px] text-fg-muted">
                {g.count} 层 · {g.sub}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function shortLabel(label: string): string {
  const map: Record<string, string> = {
    KDA: 'KDA',
    'Gated MLA': 'MLA',
    Dense: 'D',
    'Gated DeltaNet': 'GDN',
    'Gated Attention': 'GA',
  }
  return map[label] ?? label.slice(0, 3)
}
