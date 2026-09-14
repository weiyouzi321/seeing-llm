import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AttentionScaling } from '@/components/AttentionScaling'
import { K3_MODULES, getK3Module } from '@/lib/k3'
import { MODELS } from '@/lib/models'

/** 静态导出：预生成全部模块页 */
export function generateStaticParams() {
  return K3_MODULES.map((m) => ({ slug: m.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const mod = getK3Module(params.slug)
  if (!mod) return {}
  return {
    title: `${mod.name} · Kimi K3 · seeing-llm`,
    description: mod.oneLine,
  }
}

export default function ModulePage({ params }: { params: { slug: string } }) {
  const mod = getK3Module(params.slug)
  if (!mod) notFound()

  const idx = K3_MODULES.findIndex((m) => m.slug === mod.slug)
  const prev = idx > 0 ? K3_MODULES[idx - 1] : null
  const next = idx < K3_MODULES.length - 1 ? K3_MODULES[idx + 1] : null
  const m = MODELS.k3

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">架构解剖</Link>
        <span className="mx-2">/</span>
        <Link href="/architecture/kimi-k3" className="hover:text-neon transition">Kimi K3</Link>
        <span className="mx-2">/</span>
        <span className="text-k3">{mod.name}</span>
      </div>

      {/* 标题 */}
      <div className="eyebrow mb-2">Kimi K3 模块 {String(idx + 1).padStart(2, '0')} / {String(K3_MODULES.length).padStart(2, '0')}</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-1 text-k3">{mod.name}</h1>
      {mod.fullName && <div className="font-mono text-xs text-fg-dim mb-3">{mod.fullName}</div>}
      <p className="text-lg text-fg-muted leading-relaxed mb-10">{mod.oneLine}</p>

      {/* 三段：问题 / 设计 / 取舍 */}
      <div className="space-y-5 mb-12">
        <Block tag="问题" color="#FB923C" title="它要解决什么矛盾">
          {mod.problem}
        </Block>
        <Block tag="设计" color="#22D3EE" title="它怎么解决">
          {mod.design}
        </Block>
        <Block tag="取舍" color="#A78BFA" title="代价是什么">
          {mod.tradeoff}
        </Block>
      </div>

      {/* 交互可视化 */}
      {mod.viz === 'attention-scaling' && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2">为什么必须上线性注意力</h2>
          <p className="text-sm text-fg-muted mb-4 leading-relaxed">
            拖动序列长度，看全注意力的 L² 项是怎么失控的。注意短序列段 —— 线性注意力并不总是更省。
          </p>
          <AttentionScaling />
        </section>
      )}

      {/* 要点 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">关键要点</h2>
        <div className="panel divide-y divide-line">
          {mod.points.map((p) => (
            <div key={p.k} className="p-4 flex gap-4 text-sm">
              <span className="font-mono text-xs text-fg-dim w-32 shrink-0 pt-0.5">{p.k}</span>
              <span className="text-fg-muted leading-relaxed">{p.v}</span>
            </div>
          ))}
        </div>
        {mod.source && (
          <p className="text-xs font-mono text-fg-dim mt-3">参考：{mod.source}</p>
        )}
      </section>

      {/* 上下导航 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {prev ? (
          <Link href={`/architecture/kimi-k3/${prev.slug}`} className="panel p-4 hover:bg-white/[0.02] transition">
            <div className="eyebrow mb-1">← 上一个</div>
            <div className="font-semibold" style={{ color: m.hex }}>{prev.name}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/architecture/kimi-k3/${next.slug}`} className="panel p-4 text-right hover:bg-white/[0.02] transition">
            <div className="eyebrow mb-1">下一个 →</div>
            <div className="font-semibold" style={{ color: m.hex }}>{next.name}</div>
          </Link>
        )}
      </div>

      <Link href="/architecture/kimi-k3" className="btn-ghost">← 返回 K3 概览</Link>
    </div>
  )
}

function Block({
  tag,
  color,
  title,
  children,
}: {
  tag: string
  color: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="panel p-5 border-l-2" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded border"
          style={{ color, borderColor: `${color}66`, background: `${color}1A` }}
        >
          {tag}
        </span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-fg-muted leading-relaxed">{children}</p>
    </div>
  )
}
