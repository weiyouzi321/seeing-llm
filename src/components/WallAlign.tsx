'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Slider, Note } from '@/components/opviz/ui'
import { MODELS, LAYER_STYLE } from '@/lib/models'
import { modulePath } from '@/lib/routes'

/**
 * 双模型层墙对齐 —— 本站最有原创价值的一张对照
 *
 * K3：    1 稠密 + 23 × (3 KDA + 1 Gated MLA) = 93
 * Qwen3.8：        23 × (3 Gated DeltaNet + 1 Gated Attention) = 92
 *
 * 宏循环结构完全同构（23 × 4），差异被限制在两个位置：
 *   位置 1–3：线性注意力各自怎么实现（KDA vs Gated DeltaNet）
 *   位置 4：  全注意力各自怎么实现（Gated MLA vs Gated Attention）
 *
 * 所以对齐之后，「同一副骨架」就不是一个比喻 —— 而是可以逐层指着看的四列。
 */

const REPEAT = 23

/** 每个模型在每个位置上的层信息 */
interface Slot {
  label: string
  sub: string
  kind: 'linear' | 'full'
  href?: string
  detail: string
}

const K3_SLOTS: Slot[] = [
  mkSlot('KDA', 'Kimi Delta Attention', 'linear', 'k3', 'kda', 'K3 自研的线性注意力实现：Δ 规则递推 + 门控，配 7168 隐藏维 / 96 头。'),
  mkSlot('KDA', 'Kimi Delta Attention', 'linear', 'k3', 'kda', '同一芽孢位置再铺一层 —— 线性层连续 3 层，中间没有全注意力打断。'),
  mkSlot('KDA', 'Kimi Delta Attention', 'linear', 'k3', 'kda', '最后一个线性层，紧接着就是本组唯一的全注意力。'),
  mkSlot('Gated MLA', '门控多头潜在注意力', 'full', 'k3', 'gated-mla', '把 KV 压进 3584 维 latent，再加门控 —— 全组唯一需要存 KV 的一层。'),
]

const QWEN_SLOTS: Slot[] = [
  mkSlot('GDN', 'Gated DeltaNet', 'linear', 'qwen', 'gated-deltanet', '另一条线性实现：Δ 规则 + 门控，128 个 V 头 / 16 个 QK 头（dim 128）。'),
  mkSlot('GDN', 'Gated DeltaNet', 'linear', 'qwen', 'gated-deltanet', '与上面的 KDA 处在完全相同的位置 —— 这就是「同构」的字面意思。'),
  mkSlot('GDN', 'Gated DeltaNet', 'linear', 'qwen', 'gated-deltanet', '连续第 3 个线性层，同样不存 KV。'),
  mkSlot('GA', 'Gated Attention', 'full', 'qwen', 'gated-attention', '64 Q / 4 KV 的 16:1 极端 GQA，RoPE 只作用在 64 维 —— 极省版全注意力。'),
]

function mkSlot(
  label: string,
  sub: string,
  kind: 'linear' | 'full',
  model: 'k3' | 'qwen',
  slug: string,
  detail: string,
): Slot {
  return { label, sub, kind, href: modulePath(model, slug), detail }
}

export function WallAlign() {
  const [groups, setGroups] = useState(4)
  const [active, setActive] = useState<{ g: number; p: number } | null>(null)

  const shown = Array.from({ length: Math.min(groups, REPEAT) }, (_, i) => i + 1)

  const cur = active
  const k3Slot = cur ? K3_SLOTS[cur.p] : null
  const qwenSlot = cur ? QWEN_SLOTS[cur.p] : null

  return (
    <div className="panel p-6">
      <div className="eyebrow mb-1">宏循环对齐 · 展开前 {groups} / {REPEAT} 组</div>
      <div className="font-mono text-sm mb-5">
        <span className="text-k3 font-semibold">Kimi K3</span>
        <span className="text-fg-dim"> · 第 {(groups * 4 + 1).toLocaleString()} 层为止</span>
        <span className="text-fg-dim"> ⟷ </span>
        <span className="text-qwen font-semibold">Qwen3.8</span>
        <span className="text-fg-dim"> · 第 {(groups * 4).toLocaleString()} 层为止</span>
      </div>

      {/* 对齐表 */}
      <div className="space-y-2 mb-5">
        {shown.map((g) => {
          // K3 有 1 层稠密前缀，所以组 g 覆盖 4(g-1)+2 .. 4(g-1)+5
          const kStart = 4 * (g - 1) + 2
          const kEnd = kStart + 3
          const qStart = 4 * (g - 1) + 1
          const qEnd = qStart + 3

          return (
            <div key={g} className="rounded-lg border border-line bg-raised/30 p-3">
              <div className="flex items-baseline justify-between mb-2 font-mono text-[10px] text-fg-dim">
                <span>组 {String(g).padStart(2, '0')}</span>
                <span>
                  K3 L{kStart}–L{kEnd} ⟷ Qwen L{qStart}–L{qEnd}
                </span>
              </div>

              <WallRow modelId="k3" slots={K3_SLOTS} g={g} active={active} setActive={setActive} />
              <div className="h-1.5" />
              <WallRow modelId="qwen" slots={QWEN_SLOTS} g={g} active={active} setActive={setActive} />
            </div>
          )
        })}

        {groups < REPEAT && (
          <div className="text-center font-mono text-[11px] text-fg-dim py-1">
            ··· 同一模式重复至第 {REPEAT} 组（K3 共 93 层 · Qwen3.8 共 92 层）
          </div>
        )}
      </div>

      <Slider
        label="展开组数"
        value={groups}
        min={1}
        max={REPEAT}
        onChange={setGroups}
        display={`${groups} 组 / ${REPEAT}`}
      />

      {/* 对照详情 */}
      <div className="min-h-[132px] rounded-lg border border-line bg-void/60 px-4 py-3 mb-4">
        {cur && k3Slot && qwenSlot ? (
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-line text-fg-dim">
                组 {cur.g} · 第 {cur.p + 1} 位
              </span>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{
                  background: LAYER_STYLE[k3Slot.kind].fill,
                  color: LAYER_STYLE[k3Slot.kind].text,
                }}
              >
                {k3Slot.kind === 'linear' ? '线性注意力位' : '全注意力位'}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Cell model="k3" slot={k3Slot} />
              <Cell model="qwen" slot={qwenSlot} />
            </div>
            <p className="text-[11px] text-fg-dim leading-relaxed mt-2.5">
              {cur.p < 3
                ? '两边都在做同一件事：用线性注意力避开 L² 项，且不存 KV。差别在于「线性」的具体实现与头数配置，以及各自配套的隐藏维。'
                : '两边都在补同一件事：每 4 层给一次全注意力，把线性层压缩掉的表达力找回来。差别在于压缩 KV 的手段 —— 一个用 latent，一个用极端 GQA。'}
            </p>
          </div>
        ) : (
          <span className="text-fg-dim text-sm font-mono">
            把鼠标移到任意层块上 —— 看「同一位置、两家怎么做」
          </span>
        )}
      </div>

      {/* 图例 + 速算 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono mb-4">
        {(['linear', 'full'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm border"
              style={{ background: LAYER_STYLE[k].fill, borderColor: LAYER_STYLE[k].stroke }}
            />
            <span className="text-fg-muted">{LAYER_STYLE[k].label}</span>
          </span>
        ))}
        <span className="text-fg-dim">3:1 配比 → KV Cache 削减 n/(n+1) = 75%</span>
      </div>

      <p className="text-sm text-fg-muted leading-relaxed">
        这张图真正的价值在于：它把「K3 和 Qwen3.8 很像」从一句印象变成了<span className="text-fg">四个可以直接对比的位置</span>。
        线性位的差异是「实现路线与头数配置」，全注意力位的差异是「压 KV 的手段」——
        层数为 92 还是 93，只因为 K3 在最前面多加了 1 层稠密把输入抬到隐藏维。
      </p>

      <Note>
        层号映射：K3 有 1 层稠密前缀，所以它的第 g 组落在 L(4g−2)–L(4g+1)；Qwen3.8 没有前缀，第 g 组就是 L(4g−3)–L(4g)。
        对齐比较的是「宏循环内的位置」，不是绝对层号 —— 这也是两侧总层数差 1 的唯一原因。
      </Note>
    </div>
  )
}

function WallRow({
  modelId,
  slots,
  g,
  active,
  setActive,
}: {
  modelId: 'k3' | 'qwen'
  slots: Slot[]
  g: number
  active: { g: number; p: number } | null
  setActive: (v: { g: number; p: number } | null) => void
}) {
  const m = MODELS[modelId]
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[10px] w-16 shrink-0 ${m.textClass}`}>{m.name}</span>
      <div className="flex-1 grid grid-cols-4 gap-1.5">
        {slots.map((s, p) => {
          const st = LAYER_STYLE[s.kind]
          const on = active?.g === g && active?.p === p
          return (
            <Link
              key={p}
              href={s.href!}
              onMouseEnter={() => setActive({ g, p })}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive({ g, p })}
              onBlur={() => setActive(null)}
              className="rounded-md border px-2 py-2 text-center transition-all duration-150"
              style={{
                background: on ? st.fill : 'rgba(255,255,255,0.025)',
                borderColor: on ? st.stroke : 'rgba(120,160,255,0.16)',
                boxShadow: on ? `0 0 18px -4px ${st.stroke}` : undefined,
                transform: on ? 'scale(1.03)' : undefined,
              }}
            >
              <div className="font-mono text-[11px] font-semibold" style={{ color: st.text }}>
                {s.label}
              </div>
              <div className="text-[9px] text-fg-dim leading-tight mt-0.5">{s.sub}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Cell({ model, slot }: { model: 'k3' | 'qwen'; slot: Slot }) {
  const m = MODELS[model]
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: `${m.hex}44`, background: `${m.hex}0D` }}>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-[11px] font-semibold" style={{ color: m.hex }}>
          {m.name}
        </span>
        <span className="font-mono text-[10px] text-fg-dim">{slot.label}</span>
      </div>
      <p className="text-[11px] text-fg-muted leading-relaxed">{slot.detail}</p>
    </div>
  )
}
