import Link from 'next/link'
import { ROADMAP } from '@/lib/models'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: '建设方案 · seeing-llm',
  description: 'seeing-llm 建设方案 v2.1 摘要：定位、信息架构、里程碑与已确认的关键决策。',
}

/** v2.1 已冻结的决策 */
const DECISIONS = [
  { k: '项目名', v: 'seeing-llm（看见大模型）' },
  { k: '焦点模型', v: 'Kimi K3 · DeepSeek V4.1 Flash · Qwen3.8' },
  { k: '图片路线', v: '先用官方原图压缩（非自绘 SVG），三档 webp' },
  { k: '算子范围', v: '高频前 20（16 个 🔥 + 4 个补充）' },
  { k: '语言', v: '先做中文' },
  { k: 'Qwen3.8 27B', v: '对比表留占位行，发布后补，不阻塞 P3' },
  { k: 'V4 Pro', v: '仅留一行历史记录，不做独立解剖页' },
  { k: '剩余 21 算子', v: '列「待补清单」长期滚动，按访问热度补' },
]

export default function PlanPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Plan</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">建设方案 v2.1</h1>
      <p className="text-fg-muted leading-relaxed mb-10">
        规格已冻结。完整文档见仓库内的{' '}
        <span className="font-mono text-fg">seeing-llm-建设方案-v2.1.md</span>
        ，本页是执行摘要。
      </p>

      {/* 已确认决策 */}
      <h2 className="text-xl font-bold mb-4">已确认的关键决策</h2>
      <div className="panel divide-y divide-line mb-12">
        {DECISIONS.map((d) => (
          <div key={d.k} className="p-4 flex gap-4 text-sm">
            <span className="font-mono text-xs text-fg-dim w-32 shrink-0 pt-0.5">{d.k}</span>
            <span className="text-fg-muted leading-relaxed">{d.v}</span>
          </div>
        ))}
      </div>

      {/* 里程碑 */}
      <h2 className="text-xl font-bold mb-4">里程碑</h2>
      <div className="panel divide-y divide-line mb-12">
        {ROADMAP.map((p) => (
          <div key={p.id} className="p-4 flex gap-4 text-sm">
            <span className="font-mono text-xs text-fg-dim w-8 shrink-0 pt-0.5">{p.id}</span>
            <div>
              <div className={`font-semibold mb-1 ${p.status === 'todo' ? 'text-fg-muted' : 'text-fg'}`}>
                {p.title}
              </div>
              <div className="text-fg-muted leading-relaxed">{p.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 明确不做 */}
      <h2 className="text-xl font-bold mb-4">明确不做</h2>
      <div className="panel p-5 mb-12 text-sm text-fg-muted space-y-2 leading-relaxed">
        <p>
          <span className="font-mono text-fg-dim">✘</span> 在线判题 —— 静态导出无后端。
          这恰恰是与 TorchCode 的分界：<span className="text-fg">它是练习场，本站是理解场。</span>
        </p>
        <p>
          <span className="font-mono text-fg-dim">✘</span> 真实模型推理 —— 一律使用预计算 logits。
        </p>
        <p>
          <span className="font-mono text-fg-dim">✘</span> 承诺补完全部 41 个算子 ——
          只承诺 P2 的 20 个 + 待补清单上线。
        </p>
      </div>

      <Link href="/" className="btn-ghost">← 返回首页</Link>
    </div>
  )
}
