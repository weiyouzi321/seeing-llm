import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LayerWall } from '@/components/LayerWall'
import { RatioExplorer } from '@/components/RatioExplorer'
import { MODELS, type ModelId } from '@/lib/models'
import { getModules, type ModuleDoc } from '@/lib/modules'
import { MODEL_PARAMS, modulePath, getModelByRoute } from '@/lib/routes'

/** 静态导出：三个焦点模型各生成一页 */
export function generateStaticParams() {
  return MODEL_PARAMS
}

export function generateMetadata({ params }: { params: { model: string } }) {
  const id = getModelByRoute(params.model)
  if (!id) return {}
  const m = MODELS[id]
  return {
    title: `${m.name} 解剖 · seeing-llm`,
    description: `${m.name} 逐层解剖：${m.arch.formula}。${m.headline}`,
  }
}

export default function ModelPage({ params }: { params: { model: string } }) {
  const id = getModelByRoute(params.model)
  if (!id) notFound()
  const m = MODELS[id]
  const mods = getModules(id)

  const ctx = m.spec.find((s) => s.label.startsWith('上下文'))?.value ?? '—'
  const isMacro = m.arch.style === 'macro'

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">架构解剖</Link>
        <span className="mx-2">/</span>
        <span className={m.textClass}>{m.name}</span>
      </div>

      {/* Hero */}
      <div className="eyebrow mb-2">{m.released} 发布</div>
      <h1 className="text-3xl md:text-5xl font-bold mb-3">
        <span className={m.textClass}>{m.name}</span>
      </h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">{m.headline}</p>
      <p className="font-mono text-xs text-fg-dim mb-10">{m.fullName}</p>

      {/* 关键数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {[
          { k: '总参数', v: m.params.total },
          { k: '激活参数', v: m.params.active },
          { k: '层数', v: String(m.arch.total) },
          { k: '上下文', v: ctx },
        ].map((s) => (
          <div key={s.k} className="panel p-4">
            <div className={`font-mono text-2xl font-semibold ${m.textClass}`}>{s.v}</div>
            <div className="text-xs text-fg-dim mt-1">{s.k}</div>
          </div>
        ))}
      </div>

      {/* 层骨架 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-2">层骨架</h2>
        <p className="text-sm text-fg-muted mb-4 max-w-3xl leading-relaxed">{ARCH_INTRO[id]}</p>
        <div className="panel p-6">
          <LayerWall ids={[id]} maxLayers={id === 'v4' ? 12 : 17} />
        </div>
        <p className="text-xs font-mono text-fg-dim mt-3">{m.arch.formula}</p>
      </section>

      {/* 核心交互 */}
      <section className="mb-14">
        {isMacro ? (
          <>
            <h2 className="text-xl font-bold mb-2">为什么是 3:1</h2>
            <p className="text-sm text-fg-muted mb-4 max-w-3xl leading-relaxed">
              拖动滑块改变线性/全注意力的配比，看 KV Cache 削减与表达力之间的取舍。
              K3 与 Qwen3.8 都停在 3:1 —— 削减 75% 的 KV，同时每 4 层保留一次全注意力兜底。
            </p>
            <RatioExplorer />
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2">为什么把 Encoder 请回来</h2>
            <p className="text-sm text-fg-muted mb-4 max-w-3xl leading-relaxed">
              V4.1 Flash 不走「层间配比」，而是纵向切一刀：前 20 层把 prompt 压成一份全局 KV，
              后 20 层直接复用它，prompt 侧的重活只做一次。
            </p>
            <div className="panel p-6">
              <SplitExplain />
            </div>
            <div className="mt-4">
              <Link href={modulePath('v4', 'ced')} className="btn-ghost">
                CED 交互：prompt 侧的 KV 要算几遍 →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 完整规格 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">完整规格</h2>
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {m.spec.map((row, i) => (
                <tr key={row.label} className={i < m.spec.length - 1 ? 'border-b border-line/50' : ''}>
                  <td className="p-3 font-mono text-xs text-fg-dim w-48">{row.label}</td>
                  <td className="p-3 text-fg-muted">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-mono text-fg-dim mt-3">{LICENSE_NOTE[id]}</p>
      </section>

      {/* 模块入口 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">{mods.length} 个模块</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {mods.map((mod) => (
            <ModuleCard key={mod.slug} mod={mod} hex={m.hex} modelRoute={params.model} />
          ))}
        </div>
      </section>

      {/* 横向延伸 */}
      <div className="flex flex-wrap gap-4">
        <Link href="/architecture" className="btn-ghost">← 返回架构解剖</Link>
        {isMacro && (
          <Link href="/architecture/alignment" className="btn-ghost">
            双模型层墙对齐 ⟷
          </Link>
        )}
        <Link href="/topics" className="btn-ghost">横向专题 →</Link>
      </div>
    </div>
  )
}

/* ---------------- 子件 ---------------- */

function ModuleCard({
  mod,
  hex,
  modelRoute,
}: {
  mod: ModuleDoc
  hex: string
  modelRoute: string
}) {
  return (
    <Link
      href={`/architecture/${modelRoute}/${mod.slug}`}
      className="card-interactive p-5 border-l-2"
      style={{ borderLeftColor: hex }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-semibold" style={{ color: hex }}>{mod.name}</h3>
        {mod.viz && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-neon/40 text-neon bg-neon/10">
            可交互
          </span>
        )}
      </div>
      <p className="text-sm text-fg-muted leading-relaxed mb-3">{mod.oneLine}</p>
      <span className="font-mono text-[11px] text-fg-dim">
        {mod.points.length} 项要点 · 含设计取舍 →
      </span>
    </Link>
  )
}

/** V4.1 Flash 的纵向切分示意图（服务端渲染，静态） */
function SplitExplain() {
  const enc = MODELS.v4.arch.groups?.[0]
  const dec = MODELS.v4.arch.groups?.[1]
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Chip label="Prompt P 个 token" color="#8A9BB8" />
        <Arrow />
        <Chip label={`${enc?.title} · ${enc?.count} 层`} color="#22D3EE" />
        <Arrow />
        <Chip label="全局 KV（跨层共享 1 份）" color="#FB923C" />
      </div>
      <div className="flex items-center gap-3 flex-wrap pl-4 border-l border-line ml-2">
        <Chip label={`${dec?.title} · ${dec?.count} 层`} color="#67E8F9" />
        <span className="font-mono text-[11px] text-fg-dim">
          每生成一个 token，直接读这份全局 KV，不再重算 prompt 侧
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <MiniStat k="prompt 侧 KV 份数" v="1 份（共享）" sub="decoder-only 需要 20 份" color="#22D3EE" />
        <MiniStat k="prefill 激活" v="8B" sub="编码器只跑一次" color="#FB923C" />
        <MiniStat k="decode 激活" v="16B" sub="解码承担主体计算" color="#FB923C" />
      </div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="font-mono text-xs px-3 py-1.5 rounded-md border"
      style={{ color, borderColor: `${color}55`, background: `${color}12` }}
    >
      {label}
    </span>
  )
}

function Arrow() {
  return <span className="font-mono text-sm text-fg-dim">→</span>
}

function MiniStat({ k, v, sub, color }: { k: string; v: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-2.5">
      <div className="eyebrow mb-1">{k}</div>
      <div className="font-mono text-base font-semibold tabular-nums" style={{ color }}>{v}</div>
      <div className="text-[11px] text-fg-dim mt-0.5 leading-snug">{sub}</div>
    </div>
  )
}

const ARCH_INTRO: Record<ModelId, string> = {
  k3: '前面 1 层稠密把输入抬到隐藏维，之后进入 23 次宏循环：3 层 KDA（线性，不存 KV）+ 1 层 Gated MLA（全注意力，要存 KV）。93 = 1 + 23 × 4。',
  v4: '40 层被纵向切成两段：前 20 层是 causal encoder，一次性把整段 prompt 压成一份全局 KV；后 20 层是 decoder，不再各自算 prompt 的 KV，而是直接读取编码器末层的投影。',
  qwen: '没有稠密前缀，直接进入 23 次宏循环：3 层 Gated DeltaNet（线性）+ 1 层 Gated Attention（全注意力）。92 = 23 × 4，结构与 K3 完全同构，只比它少一层前缀。',
}

const LICENSE_NOTE: Record<ModelId, string> = {
  k3: '许可：Kimi K3 License（非 MIT/Apache）—— 非商业教育用途不受限，但需保留来源标注。',
  v4: '许可：开源权重（Hugging Face）。本页规格为公开模型卡口径，交互演示均为本站自制的简化模型。',
  qwen: '许可：开源权重（ModelScope / Hugging Face）。本页规格为公开模型卡口径，交互演示均为本站自制的简化模型。',
}
