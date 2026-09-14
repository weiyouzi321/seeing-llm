import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SparsityCompare } from '@/components/topics/SparsityCompare'
import { KvRoutes } from '@/components/topics/KvRoutes'
import { TOPICS, MODELS, type Topic } from '@/lib/models'
import { modulePath, modelPath } from '@/lib/routes'

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const t = TOPICS.find((x) => x.slug === params.slug)
  if (!t) return {}
  return { title: `${t.title} · 横向专题 · seeing-llm`, description: t.question }
}

/** 每个专题的三张延伸卡 —— 指向各自的模块页 */
const DEEP_DIVE: Record<string, { model: Topic['entries'][number]['model']; slug: string; name: string }[]> = {
  'moe-sparsity': [
    { model: 'k3', slug: 'latent-moe', name: 'Stable LatentMoE' },
    { model: 'v4', slug: 'mhc', name: 'Single-Pass mHC' },
    { model: 'qwen', slug: 'gated-deltanet', name: 'Gated DeltaNet' },
  ],
  'kv-cache': [
    { model: 'k3', slug: 'gated-mla', name: 'Gated MLA' },
    { model: 'v4', slug: 'kv-compression', name: 'FP4 主 KV' },
    { model: 'qwen', slug: 'gated-attention', name: 'Gated Attention' },
  ],
}

export default function TopicPage({ params }: { params: { slug: string } }) {
  const t = TOPICS.find((x) => x.slug === params.slug)
  if (!t) notFound()
  const dive = DEEP_DIVE[t.slug] ?? []

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/topics" className="hover:text-neon transition">横向专题</Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{t.title}</span>
      </div>

      <div className="eyebrow mb-2">同一问题的三种解法</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{t.title}</h1>
      <p className="text-lg text-fg-muted leading-relaxed mb-4 font-mono">「{t.question}」</p>
      <p className="text-base text-fg-muted leading-relaxed mb-10">{t.body}</p>

      {/* 三家的答案 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">三家的答案</h2>
        <div className="space-y-3">
          {t.entries.map((e) => {
            const m = MODELS[e.model]
            return (
              <div
                key={e.model}
                className="panel p-5 border-l-2 flex gap-4"
                style={{ borderLeftColor: m.hex }}
              >
                <div className="w-28 shrink-0">
                  <div className={`font-semibold text-sm ${m.textClass}`}>{m.name}</div>
                  <Link
                    href={modelPath(e.model)}
                    className="font-mono text-[10px] text-fg-dim hover:text-neon transition"
                  >
                    概览页 →
                  </Link>
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">{e.answer}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 交互对照 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-2">把它量化</h2>
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          {t.slug === 'moe-sparsity'
            ? '下面的曲线是一条能被解析写出来的性质：负载均衡成立时，一个专家在 T 个 token 内一次都没被选中的概率 ≈ (1 − k/E)^T。稀疏度越激进，这条曲线下降得越慢。'
            : '下面按「每 token 存多少字节」估算整段上下文的 KV 占用。绝对值可以商榷，量级差才是重点。'}
        </p>
        {t.slug === 'moe-sparsity' ? <SparsityCompare /> : <KvRoutes />}
      </section>

      {/* 延伸 */}
      {dive.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">顺着往下读</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {dive.map((d) => {
              const m = MODELS[d.model]
              return (
                <Link
                  key={`${d.model}:${d.slug}`}
                  href={modulePath(d.model, d.slug)}
                  className="card-interactive p-4 border-l-2"
                  style={{ borderLeftColor: m.hex }}
                >
                  <div className={`eyebrow mb-1 ${m.textClass}`}>{m.name}</div>
                  <div className="font-semibold text-sm">{d.name}</div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-4">
        <Link href="/topics" className="btn-ghost">← 返回横向专题</Link>
        <Link href="/architecture/alignment" className="btn-ghost">双模型层墙对齐 →</Link>
      </div>
    </div>
  )
}
