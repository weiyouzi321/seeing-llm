import Link from 'next/link'
import { PanoramaTable } from '@/components/PanoramaTable'
import { PANORAMA } from '@/lib/panorama'

export const metadata = {
  title: '开源模型全景对比 · seeing-llm',
  description:
    '12 个代表性开源模型的横向对照：总参数 / 激活参数 / 稀疏度 / 层骨架 / 注意力形态 / 上下文 / 许可。三种可切换轴的散点图。',
}

export default function PanoramaPage() {
  const focus = PANORAMA.filter((m) => m.focus)
  const maxCtx = PANORAMA.filter((m) => m.ctx >= 1_000_000).length
  const hybrid = PANORAMA.filter((m) => m.attnKind === 'hybrid').length

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">
          架构解剖
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">全景对比</span>
      </div>

      <div className="eyebrow mb-2">Track A · Panorama</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">开源模型全景对比</h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">
        本站逐层解剖的只有三个模型，但<span className="text-fg">看不懂趋势的解剖是记不住的</span>。
        这张表把 12 个代表性开源模型摊开，只为了回答一个问题：
        <span className="text-fg">过去两年，开源大模型到底在哪几个方向上真的动了？</span>
      </p>
      <div className="flex flex-wrap gap-4 mb-10 font-mono text-xs text-fg-dim">
        <span>
          <span className="text-neon">{PANORAMA.length}</span> 个模型
        </span>
        <span>
          <span className="text-neon">{hybrid}</span> 个线性 + 全注意力混合
        </span>
        <span>
          <span className="text-neon">{maxCtx}</span> 个 ≥ 1M 上下文
        </span>
        <span>
          <span className="text-neon">{focus.length}</span> 个焦点模型可跳转解剖
        </span>
      </div>

      {/* 三个趋势 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">先把三个趋势说出来</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TRENDS.map((t) => (
            <div key={t.t} className="panel p-5">
              <div className="eyebrow mb-2">{t.tag}</div>
              <h3 className="font-semibold mb-2">{t.t}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 主交互 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">摊开看</h2>
        <PanoramaTable />
      </section>

      {/* 口径说明 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">口径与来源</h2>
        <div className="panel p-6 space-y-3 text-sm text-fg-muted leading-relaxed">
          <p>
            <span className="text-fg">稀疏度</span> = 激活参数 ÷ 总参数。稠密模型是 100%，
            Kimi K2 是 3.2%，Kimi K3 是 3.7% —— 这个数字越小，说明「参数量」和「计算量」脱钩得越彻底。
          </p>
          <p>
            <span className="text-fg">上下文</span>取官方模型卡的原生值，括号里的「可扩」指官方提供的扩展方案
            （YaRN、长文本微调或推理期内插），不等于开箱即用。
          </p>
          <p>
            <span className="text-fg">许可</span>一栏标 ⚠ 的是有附加条件或自定义许可的条目
            （Llama 3.1 Community 有月活上限与衍生品牌限制；Kimi K3 用自定义许可）。
            商用前请读原文条款 —— 这一栏只做提示，不构成法律建议。
          </p>
          <p className="text-xs font-mono text-fg-dim">
            注：部分模型的层数与隐藏维未在官方口径中公布，表里渲染为「—」。
            此前参考的 CalvinXKY/InfraTech 仓库已滞后 —— 其 models/ 目录仅 11 项，
            且不含 qwen3_8 与 deepseek_v4_1_flash，因此本表的数据改从 HF 模型卡、ModelScope
            与官方技术报告取，核实于 2026-09-14。
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/architecture" className="btn-ghost">
          ← 返回架构解剖
        </Link>
        <Link href="/architecture/alignment" className="btn-ghost">
          双模型层墙对齐 ⟷
        </Link>
        <Link href="/architecture/evolution" className="btn-ghost">
          架构演进时间轴 →
        </Link>
      </div>
    </div>
  )
}

const TRENDS = [
  {
    tag: 'Trend 01',
    t: '参数在涨，计算量没怎么涨',
    body: '总参数从 405B 涨到 2.8T（约 7 倍），激活参数始终在 5B–104B 之间。MoE 把「模型有多大」和「前向有多贵」这两件事彻底拆开了。',
  },
  {
    tag: 'Trend 02',
    t: '注意力从全连接走向混合',
    body: '2024 年主流还是 GQA / MLA 这类「全注意力 + 省 KV」；2025 年起出现 7:1 混合，2026 年三个旗舰里有两个用 3:1。层间配比成了一等公民。',
  },
  {
    tag: 'Trend 03',
    t: '1M 上下文从噱头变成门槛',
    body: '128K 曾是 2024 年的标配，2026 年三个焦点模型全部站在 1M 或 262K 可扩 1M。但实现路径完全不同 —— 本站 KV Cache 专题就是拆这件事的。',
  },
]
