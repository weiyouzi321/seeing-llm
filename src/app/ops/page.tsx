import Link from 'next/link'
import { OPS, OPS_BACKLOG, type OpGroup } from '@/lib/ops'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: '算子与策略 · seeing-llm',
  description: 'TorchCode 高频前 20 个算子：每个一页，可视化张量 + 公式 + 可调参数。',
}

const GROUPS: OpGroup[] = ['基础', '注意力', '推理策略', '为模型补']

const GROUP_COLOR: Record<OpGroup, string> = {
  基础: '#94A3B8',
  注意力: '#22D3EE',
  推理策略: '#FB923C',
  为模型补: '#A78BFA',
}

const FREQ_MARK: Record<string, string> = {
  fire: '🔥',
  star: '⭐',
  bulb: '💡',
  extra: '★',
}

export default function OpsPage() {
  const extra = OPS.filter((o) => o.freq === 'extra').length
  const backlog = OPS_BACKLOG.star + OPS_BACKLOG.bulb

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Track C</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">算子与策略</h1>
      <p className="text-fg-muted max-w-3xl leading-relaxed mb-4">
        把 PyTorch 源码变成&ldquo;画给你看&rdquo;的可执行小工具。
        范围取 TorchCode 的<span className="text-fg"> 高频前 20</span>：
        16 个 🔥 高频，加上 4 个为三焦点模型补的。
      </p>
      <div className="flex flex-wrap gap-4 mb-10 font-mono text-xs text-fg-dim">
        <span><span className="text-neon">{OPS.length}</span> 个算子页（P2）</span>
        <span><span className="text-neon">{extra}</span> 个为模型补充</span>
        <span><span className="text-neon">{backlog}</span> 个进待补清单</span>
      </div>

      {GROUPS.map((g) => {
        const list = OPS.filter((o) => o.group === g)
        if (!list.length) return null
        return (
          <section key={g} className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLOR[g] }} />
              <h2 className="text-lg font-bold">{g}</h2>
              <span className="font-mono text-xs text-fg-dim">{list.length}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {list.map((o) => (
                <div
                  key={o.fn}
                  className="panel p-4 border-l-2 hover:bg-white/[0.02] transition"
                  style={{ borderLeftColor: GROUP_COLOR[g] }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs">{FREQ_MARK[o.freq]}</span>
                    <h3 className="font-semibold text-sm">{o.name}</h3>
                    <code className="font-mono text-[10px] text-fg-dim bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {o.fn}
                    </code>
                  </div>
                  <p className="text-sm text-fg-muted leading-relaxed">{o.oneLine}</p>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* 待补清单 */}
      <section className="panel p-5">
        <h2 className="text-lg font-bold mb-2">待补清单</h2>
        <p className="text-sm text-fg-muted leading-relaxed mb-3">
          剩余 <span className="font-mono text-fg">{backlog}</span> 个算子
          （⭐ {OPS_BACKLOG.star} 个 + 💡 {OPS_BACKLOG.bulb} 个）不承诺全量补完，
          而是列成清单长期滚动，按访问热度决定下一个写谁。
        </p>
        <p className="text-xs font-mono text-fg-dim">
          补这 4 个非高频算子的原因：MoE / GQA / Linear Attention / GPT-2 Block
          正好是三轨交叉链接的四个断链点 —— 不补它们，轨道 A 的模块页会大量指向&ldquo;待补&rdquo;。
        </p>
      </section>

      <div className="mt-12">
        <Link href="/" className="btn-ghost">← 返回首页</Link>
      </div>
    </div>
  )
}
