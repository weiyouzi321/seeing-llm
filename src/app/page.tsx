import Link from 'next/link'
import { Brain, GitBranch, FlaskConical } from 'lucide-react'
import { DiagramCard } from '@/components/DiagramCard'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const TRACKS = [
  {
    id: 'A',
    title: '轨道 A · 架构解剖',
    subtitle: '把 700 亿到 2.8 万亿参数的模型拆给你看',
    body: '聚焦 Kimi K3、DeepSeek V4.1 Flash、Qwen3.8 三家最新开源旗舰。14 个模块页，每页一个"它为什么这样设计"的可拖可点组件。',
    icon: Brain,
    accent: 'k3',
    bullets: ['KDA / Gated MLA / AttnRes', 'CED + CSA2 + FP4 KV', 'Gated DeltaNet / Gated Attention'],
    href: `${base}/architecture`,
  },
  {
    id: 'B',
    title: '轨道 B · 训练全流程',
    subtitle: '从 8 阶段 MiniMind 看一份大模型是怎么炼出来的',
    body: '把 MiniMind（3090 单卡、3 元跑完全流程）的 8 个训练阶段串成可视时间线，每个阶段一段代码、一张曲线、一个"这一步在干嘛"的解释。',
    icon: GitBranch,
    accent: 'v4',
    bullets: ['Tokenizer → Pretrain → SFT', 'DPO → GRPO → RLHF', 'Reasoning / 评测 / 蒸馏'],
    href: `${base}/training`,
  },
  {
    id: 'C',
    title: '轨道 C · 算子与策略',
    subtitle: '把 PyTorch 源码变成"画给你看"的可执行小工具',
    body: 'TorchCode 高频前 20 个算子，每个一页：可视化张量、3 行公式、可拖滑块改参数。剩余 21 个走"待补清单"长期滚动。',
    icon: FlaskConical,
    accent: 'qwen',
    bullets: ['16 个 🔥 高频 + 4 个补', 'ReLU → Linear → Attention', 'RoPE / Top-k / Beam Search'],
    href: `${base}/ops`,
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-soft border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-sm font-mono text-primary-600 mb-4 animate-fade-in-up">
            seeing-llm · v2.1 · 规格冻结
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 animate-fade-in-up">
            把<span className="text-gradient-hero">大模型</span>是怎么造出来的
            <br />
            变成可点、可拖、可算给你看
          </h1>
          <p className="text-lg md:text-xl text-ink-600 max-w-3xl mb-8 animate-fade-in-up">
            三个最新最知名的开源旗舰 —— <span className="font-semibold text-k3">Kimi K3</span>、
            <span className="font-semibold text-v4 mx-1">DeepSeek V4.1 Flash</span>、
            <span className="font-semibold text-qwen">Qwen3.8</span> —— 一份完整的训练流程，
            一批 PyTorch 高频算子。
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in-up">
            <Link
              href={`${base}/architecture`}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
            >
              先看 Kimi K3 架构
            </Link>
            <Link
              href={`${base}/about`}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-ink-700 border border-ink-300 font-medium hover:bg-ink-50 transition"
            >
              关于这个站点
            </Link>
          </div>

          {/* 数据条 */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            <Stat label="焦点模型" value="3 + 12" />
            <Stat label="架构模块页" value="14" />
            <Stat label="高频算子" value="20" />
            <Stat label="图片体积压缩" value="101 → 2.5 MB" />
          </div>
        </div>
      </section>

      {/* 三轨入口 */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-3">三轨信息架构</h2>
        <p className="text-ink-600 mb-12 max-w-2xl">
          站点由三条轨道组成，彼此通过"同一问题的三种解法"横向专题交叉链接 —— 这也是本站最有原创价值的部分。
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TRACKS.map((t) => {
            const Icon = t.icon
            const accentText = `text-${t.accent}` as 'text-k3' | 'text-v4' | 'text-qwen'
            const accentBorder = `border-${t.accent}` as 'border-k3' | 'border-v4' | 'border-qwen'
            return (
              <Link
                key={t.id}
                href={t.href}
                className={`block p-6 rounded-xl border border-ink-200 card-hover bg-white border-t-4 ${accentBorder}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${accentText}`} />
                  <span className="font-mono text-sm text-ink-500">轨道 {t.id}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{t.title}</h3>
                <p className="text-sm text-ink-500 mb-4">{t.subtitle}</p>
                <p className="text-ink-700 mb-4 leading-relaxed">{t.body}</p>
                <ul className="text-sm text-ink-500 space-y-1 font-mono">
                  {t.bullets.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 焦点模型架构图（P0 占位，P1/P3 替换为真实图） */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-3xl font-bold">三个焦点模型</h2>
          <span className="text-xs font-mono text-ink-500">P0 占位 · 真实图在 P1/P3</span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <DiagramCard id="k3_overall"   model="K3"   title="Kimi K3 整体架构"          sub="93 层 = 1 稠密 + 23 × (3 KDA + 1 Gated MLA) · 2.8T / 104B" />
          <DiagramCard id="v4_overall"   model="V4"   title="DeepSeek V4.1 Flash"        sub="CED · 20 编码 + 20 解码 · 552B MoE · prefill 8B / decode 16B" />
          <DiagramCard id="qwen_overall" model="Qwen" title="Qwen3.8-2.4T-A95B"          sub="92 层 = 23 × (3 Gated DeltaNet + 1 Gated Attention)" />
        </div>
      </section>

      {/* 横向专题预告 */}
      <section className="bg-ink-50 border-y border-ink-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-3">横向专题 · 同一问题的三种解法</h2>
          <p className="text-ink-600 mb-8 max-w-2xl">
            把三轨并排：每个专题一句话告诉你"三家各自怎么想、为什么这么想、谁更适合谁"。
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <TopicCard
              title="MoE 稀疏度三家对比"
              body="K3 是 896→16+2、Qwen3.8 是 512→10+1、V4.1 Flash 是 384→6+1。稀疏度一路推到 1/64 是怎么做到的？"
              accent="k3"
            />
            <TopicCard
              title="KV Cache 三条路线"
              body="K3 / Qwen3.8 用线性注意力让 KV 常数化；V4.1 Flash 用 CSA2 + FP4 把每 token KV 压到 890 字节。"
              accent="v4"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary-700 font-mono">{value}</div>
      <div className="text-sm text-ink-500 mt-1">{label}</div>
    </div>
  )
}

function TopicCard({ title, body, accent }: { title: string; body: string; accent: 'k3' | 'v4' | 'qwen' }) {
  const accentText = `text-${accent}` as 'text-k3' | 'text-v4' | 'text-qwen'
  return (
    <div className="bg-white p-5 rounded-lg border border-ink-200">
      <h3 className="font-bold mb-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-${accent} inline-block`} aria-hidden></span>
        <span className={accentText}>{title}</span>
      </h3>
      <p className="text-sm text-ink-700 leading-relaxed">{body}</p>
    </div>
  )
}