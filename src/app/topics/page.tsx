import Link from 'next/link'
import { TOPICS, MODELS } from '@/lib/models'
import { MODULE_COUNT } from '@/lib/modules'

export const metadata = {
  title: '横向专题 · seeing-llm',
  description: '同一问题的三种解法：MoE 稀疏度三家对比、KV Cache 三条路线。',
}

export default function TopicsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Cross-cutting Topics</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">横向专题</h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">
        三轨之外还差一层：<span className="text-fg">同一个问题，三家给了三种答案。</span>
        单个模型的解剖页只能看到其中一种，把三家并排放在一起，取舍才显出来。
      </p>
      <div className="flex flex-wrap gap-4 mb-12 font-mono text-xs text-fg-dim">
        <span><span className="text-neon">{TOPICS.length}</span> 个专题</span>
        <span><span className="text-neon">{MODULE_COUNT}</span> 个模块页可跳转</span>
        <span>每个专题都带一个可拖可调的组件</span>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className="card-interactive p-6 flex flex-col"
          >
            <div className="eyebrow mb-2">同一问题的三种解法</div>
            <h2 className="text-xl font-bold mb-2">{t.title}</h2>
            <p className="text-sm text-fg mb-4 font-mono leading-relaxed">「{t.question}」</p>
            <p className="text-sm text-fg-muted leading-relaxed mb-5 flex-1">{t.body}</p>

            <div className="space-y-2 mb-4">
              {t.entries.map((e) => (
                <div key={e.model} className="flex items-baseline gap-2 text-xs">
                  <span className={`font-mono shrink-0 ${MODELS[e.model].textClass}`}>
                    {MODELS[e.model].name}
                  </span>
                  <span className="text-fg-dim truncate">
                    {SHORT[e.model + ':' + t.slug] ?? ''}
                  </span>
                </div>
              ))}
            </div>

            <span className="font-mono text-[11px] text-neon">去看三家的量级差 →</span>
          </Link>
        ))}
      </div>

      {/* 待补 */}
      <section className="panel p-6 mb-12">
        <h2 className="text-lg font-bold mb-2">候选专题（尚未开工）</h2>
        <p className="text-sm text-fg-muted leading-relaxed mb-3">
          横向专题的取舍在于「能并排三个人就有见识」。下列候选已经有了对照素材，缺的只是一个把差异量化的组件：
        </p>
        <ul className="text-sm text-fg-dim space-y-1.5 font-mono">
          <li>· 上下文长度的三种撑法（1M / 262K→1.01M / 1M）</li>
          <li>· 低精度路线：MXFP4 权重 vs FP4 主 KV vs 未启用</li>
          <li>· 残差改造：AttnRes vs Single-Pass mHC</li>
          <li>· 解码加速：多步 MTP vs 半自回归草稿</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/" className="btn-ghost">← 返回首页</Link>
        <Link href="/architecture" className="btn-ghost">架构解剖 →</Link>
        <Link href="/architecture/alignment" className="btn-ghost">层墙对齐 →</Link>
      </div>
    </div>
  )
}

/** 卡片上的一句摘要，避免整个答案挤进来 */
const SHORT: Record<string, string> = {
  'k3:moe-sparsity': '896 → 16 + 2 共享',
  'qwen:moe-sparsity': '512 → 10 + 1 共享',
  'v4:moe-sparsity': '384 → 6 + 1 共享',
  'k3:kv-cache': '减少层数（−75%）',
  'qwen:kv-cache': '减少层数 + 16:1 GQA',
  'v4:kv-cache': 'FP4 压缩（890 B/token）',
}
