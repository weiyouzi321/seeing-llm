import Link from 'next/link'
import { TRAIN_STAGES, TRAIN_FACTS } from '@/lib/ops'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: '训练全流程 · seeing-llm',
  description: '用 MiniMind（64M · 3090 单卡 · 约 3 元）走完大模型训练的 8 个阶段。',
}

export default function TrainingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Track B</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">训练全流程</h1>
      <p className="text-fg-muted max-w-3xl leading-relaxed mb-10">
        用一个能自己跑完的小模型看完整条流水线 ——{' '}
        <span className="text-fg">MiniMind（64M 参数）</span>：
        3090 单卡，每个阶段 1.1–1.21 小时，全流程约 3 元。
        P4 阶段会把每个阶段做成一段代码、一张曲线、一句&ldquo;这一步在干嘛&rdquo;。
      </p>

      {/* 规格卡 */}
      <div className="panel p-5 mb-12">
        <div className="eyebrow mb-3">minimind-3 规格</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRAIN_FACTS.map((f) => (
            <div key={f.k}>
              <div className="font-mono text-sm font-semibold text-neon">{f.v}</div>
              <div className="text-[11px] text-fg-dim mt-0.5">{f.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 8 阶段 */}
      <h2 className="text-xl font-bold mb-5">8 个阶段</h2>
      <div className="panel p-6 mb-12">
        {TRAIN_STAGES.map((s, i) => (
          <div key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className="w-7 h-7 rounded-md border border-neon/40 bg-neon/10 text-neon
                           font-mono text-xs flex items-center justify-center shrink-0"
              >
                {s.id}
              </span>
              {i < TRAIN_STAGES.length - 1 && <span className="w-px flex-1 bg-line my-1.5" />}
            </div>
            <div className={i < TRAIN_STAGES.length - 1 ? 'pb-6' : ''}>
              <div className="font-semibold mb-1">{s.name}</div>
              <div className="text-sm text-fg-muted leading-relaxed mb-0.5">{s.goal}</div>
              <div className="text-xs font-mono text-fg-dim">{s.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-5 mb-12">
        <p className="text-sm text-fg-muted leading-relaxed">
          <span className="text-fg">为什么用它：</span>
          大模型训练流程的每一步，在千亿规模上都贵得无法亲自动手；
          但在 64M 规模上，整套流程能在一张消费级显卡上跑完。
          阶段划分与真正的旗舰训练是同构的 —— 差别只在规模，不在结构。
        </p>
      </div>

      <Link href={`${base}/`} className="btn-ghost">← 返回首页</Link>
    </div>
  )
}
