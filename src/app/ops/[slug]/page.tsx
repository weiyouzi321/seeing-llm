import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CodeBlock } from '@/components/CodeBlock'
import { OpViz } from '@/components/opviz'
import {
  FREQ_LABEL,
  FREQ_MARK,
  GROUP_COLOR,
  OPS,
  getOp,
  getOpLinks,
} from '@/lib/ops'

/** 静态导出：预生成全部算子页 */
export function generateStaticParams() {
  return OPS.map((o) => ({ slug: o.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const op = getOp(params.slug)
  if (!op) return {}
  return {
    title: `${op.name} · ${op.fn} · seeing-llm`,
    description: op.oneLine,
  }
}

export default function OpPage({ params }: { params: { slug: string } }) {
  const op = getOp(params.slug)
  if (!op) notFound()

  const idx = OPS.findIndex((o) => o.slug === op.slug)
  const prev = idx > 0 ? OPS[idx - 1] : null
  const next = idx < OPS.length - 1 ? OPS[idx + 1] : null
  const color = GROUP_COLOR[op.group]
  const links = getOpLinks(op.slug)
  const showIoSection = op.viz !== 'shape' && !!op.io && op.io.length > 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/ops" className="hover:text-neon transition">
          算子与策略
        </Link>
        <span className="mx-2">/</span>
        <span style={{ color }}>{op.group}</span>
        <span className="mx-2">/</span>
        <span className="text-fg">{op.name}</span>
      </div>

      {/* 标题 */}
      <div className="flex items-center gap-3 mb-2">
        <span className="eyebrow" style={{ color }}>
          算子 {String(idx + 1).padStart(2, '0')} / {String(OPS.length).padStart(2, '0')}
        </span>
        <span className="text-sm" title={FREQ_LABEL[op.freq]}>
          {FREQ_MARK[op.freq]}
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color }}>
        {op.name}
      </h1>
      <code className="inline-block font-mono text-xs text-fg-dim bg-white/[0.04] border border-line px-2 py-1 rounded mb-3">
        {op.fn}
      </code>
      <p className="text-lg text-fg-muted leading-relaxed mb-10">{op.oneLine}</p>

      {/* 它在做什么 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">它在做什么，为什么需要</h2>
        <div className="panel p-5 border-l-2" style={{ borderLeftColor: color }}>
          <p className="text-sm text-fg-muted leading-relaxed">{op.explain}</p>
        </div>
      </section>

      {/* 可视化 */}
      {op.viz !== 'none' && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2">亲手调一调</h2>
          <p className="text-sm text-fg-dim mb-4">
            下面这个是可交互的 —— 拖滑块、点按钮，看数字怎么动。
          </p>
          <OpViz op={op} />
        </section>
      )}

      {/* 形状链路（shape 类已在可视化里展示，不重复） */}
      {showIoSection && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3">张量形状链路</h2>
          <div className="panel divide-y divide-line">
            {op.io!.map((s, i) => (
              <div key={s.label} className="px-4 py-3 flex items-center gap-4 text-sm">
                <span className="font-mono text-xs text-fg-dim w-6 shrink-0">{i}</span>
                <span className="w-28 shrink-0 text-fg-muted">{s.label}</span>
                <span className="font-mono text-sm text-neon">{s.shape}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 代码 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">参考实现</h2>
        <CodeBlock code={op.code} caption={`${op.fn} · 教学精简版`} />
        <p className="text-xs font-mono text-fg-dim mt-3 leading-relaxed">
          这是为讲清原理写的精简版，去掉了 dtype / layout / 融合算子等工程细节；
          生产环境请直接用 PyTorch 原生实现（它走的是 fused kernel）。
        </p>
      </section>

      {/* 交叉链接 */}
      {links.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3">它用在哪</h2>
          <div className="space-y-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="panel p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
              >
                <span className="text-sm text-fg-muted">{l.label}</span>
                <span className="font-mono text-xs text-neon shrink-0">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 上下导航 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {prev ? (
          <Link href={`/ops/${prev.slug}`} className="panel p-4 hover:bg-white/[0.02] transition">
            <div className="eyebrow mb-1">← 上一个</div>
            <div className="font-semibold" style={{ color: GROUP_COLOR[prev.group] }}>
              {prev.name}
            </div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/ops/${next.slug}`} className="panel p-4 text-right hover:bg-white/[0.02] transition">
            <div className="eyebrow mb-1">下一个 →</div>
            <div className="font-semibold" style={{ color: GROUP_COLOR[next.group] }}>
              {next.name}
            </div>
          </Link>
        )}
      </div>

      <Link href="/ops" className="btn-ghost">
        ← 返回算子列表
      </Link>
    </div>
  )
}
