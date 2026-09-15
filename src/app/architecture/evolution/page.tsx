import Link from 'next/link'
import { EvolutionTimeline } from '@/components/EvolutionTimeline'
import { EVOLUTION, LANE_META, LANE_ORDER } from '@/lib/evolution'

export const metadata = {
  title: '架构演进时间轴 · seeing-llm',
  description:
    '从 2017 年 Transformer 到 Kimi K3 / DeepSeek V4.1 Flash / Qwen3.8：注意力、稀疏化、上下文、骨架、训练五条线索，24 个节点，每个都写清为什么重要。',
}

export default function EvolutionPage() {
  const starCount = EVOLUTION.filter((e) => e.star).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">
          架构解剖
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">演进时间轴</span>
      </div>

      <div className="eyebrow mb-2">Track A · Evolution</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">架构演进时间轴</h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">
        单看一个模型，会以为它的每个设计都是「灵光一现」。把时间轴拉长你会发现：
        <span className="text-fg">今天旗舰上的每个模块，都有一个 5 年前的前身</span>。
        这条轴只收那些<span className="text-fg">埋了线</span>的节点 ——
        当年的 SOTA 如果没留下后裔，就不在这张图上。
      </p>
      <div className="flex flex-wrap gap-4 mb-10 font-mono text-xs text-fg-dim">
        <span>
          <span className="text-neon">{EVOLUTION.length}</span> 个节点
        </span>
        <span>
          <span className="text-neon">{LANE_ORDER.length}</span> 条线索
        </span>
        <span>
          <span className="text-neon">{starCount}</span> 个与焦点模型直接相关
        </span>
        <span>2017 → 2026</span>
      </div>

      {/* 五条线索说明 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">五条线索</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LANE_ORDER.map((lane) => {
            const meta = LANE_META[lane]
            const n = EVOLUTION.filter((e) => e.lane === lane).length
            return (
              <div key={lane} className="rounded-lg border border-line bg-raised/30 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: meta.hex }} />
                  <span className="font-semibold text-sm" style={{ color: meta.hex }}>
                    {meta.label}
                  </span>
                  <span className="font-mono text-[10px] text-fg-dim ml-auto">{n} 条</span>
                </div>
                <p className="text-xs text-fg-muted leading-relaxed">{meta.oneLine}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 主交互 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">时间轴</h2>
        <EvolutionTimeline />
      </section>

      {/* 读法 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">这张图该怎么读</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {READINGS.map((r) => (
            <div key={r.t} className="panel p-5">
              <div className="eyebrow mb-2">{r.tag}</div>
              <h3 className="font-semibold mb-2">{r.t}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 口径 */}
      <section className="mb-12">
        <div className="panel p-6">
          <div className="eyebrow mb-3">口径说明</div>
          <p className="text-sm text-fg-muted leading-relaxed mb-2">
            时间取论文公开或权重发布的<span className="text-fg">最早公开时间</span>，
            不是期刊发表时间。同一年份内有多条时，按本文叙述顺序排列，不代表严格先后。
          </p>
          <p className="text-sm text-fg-muted leading-relaxed">
            本图是<span className="text-fg">教学用的因果链</span>，不是完整的学术综述：
            为了讲清「这个设计从哪来」，有意省略了大量同样重要的并行工作
            （比如 ALiBi、RWKV、Hyena、各种长上下文外推方法）。
            想补全的话，建议从各条线索的综述论文往回追。
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/architecture" className="btn-ghost">
          ← 返回架构解剖
        </Link>
        <Link href="/architecture/panorama" className="btn-ghost">
          开源模型全景对比 →
        </Link>
        <Link href="/topics" className="btn-ghost">
          横向专题 →
        </Link>
      </div>
    </div>
  )
}

const READINGS = [
  {
    tag: 'Reading 01',
    t: '先找「前身」，再找「突破」',
    body: '看到 KDA，先往回找到 2020 年的线性注意力第一波 —— 你会发现思路没变，只是把「固定核函数」换成了「可学习的状态更新规则」。所谓突破，往往是补齐了前人缺的那个零件。',
  },
  {
    tag: 'Reading 02',
    t: '注意两刀：砍维度、砍头数',
    body: 'KV Cache 这条线上，2023 年 GQA 砍的是「头数」，2024 年 MLA 砍的是「维度」。今天 K3 用后者、Qwen3.8 用前者的极端版（16:1），两条线在 2026 年会合。',
  },
  {
    tag: 'Reading 03',
    t: '训练侧的三次拐点',
    body: '预训练范式（2018）→ 对齐成为正式阶段（2022）→ 推理期算力可调（2024）。每次拐点都让「训练一个模型」的定义变宽一圈。本站轨道 B 就是把这条线拆成 8 个可跑的阶段。',
  },
]
