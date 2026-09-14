import Link from 'next/link'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">关于 seeing-llm</h1>

      <section className="prose">
        <p className="text-lg text-ink-700 leading-relaxed mb-6">
          seeing-llm 是 seeing-single-cell 的姊妹站。把"大模型是怎么造出来的"从论文与源码，
          变成可点、可拖、可算给你看的交互式教材。
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">站点定位</h2>
        <ul className="space-y-2 text-ink-700 list-disc pl-6">
          <li><strong>不</strong>做在线判题（静态导出无后端）</li>
          <li><strong>不</strong>做真实模型推理（用预计算 logits）</li>
          <li><strong>是</strong>一个"理解场"：把论文里被折叠起来的细节，用可视化、动画、滑块重新展开</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">三个焦点模型（截至 2026-09-14）</h2>
        <ul className="space-y-3 text-ink-700">
          <li>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-k3 text-white mr-2">K3</span>
            <strong>Kimi K3</strong> · 2.8T / 104B · 93 层（1 稠密 + 23×(3 KDA + 1 Gated MLA)） · 1M 上下文
          </li>
          <li>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-v4 text-white mr-2">V4.1</span>
            <strong>DeepSeek V4.1 Flash</strong> · 552B MoE · CED 40 层（20 编码 + 20 解码） · FP4 KV → 890 B/token
          </li>
          <li>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-qwen text-white mr-2">Q3.8</span>
            <strong>Qwen3.8-2.4T-A95B</strong> · 2.4T / 95B · 92 层（23×(3 Gated DeltaNet + 1 Gated Attention)） · 1M 上下文
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">图片与许可</h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          站点使用的所有架构原图均来自模型卡、技术报告等官方渠道，按教育与研究用途引用。
          <strong className="text-k3"> Kimi K3</strong> 的代码与权重遵循 Kimi K3 License（非 MIT/Apache）：
          本站非商业教育用途不受限，但页面均保留来源标注。
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">技术底座</h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          Next.js 14 静态导出 + GitHub Pages 部署链路，
          复用 seeing-single-cell 的成熟架构。
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">更多</h2>
        <p className="text-ink-700">
          完整的建设方案见{' '}
          <Link href={`${base}/plan`} className="text-primary-600 underline">
            v2.1
          </Link>
          ，仓库见{' '}
          <a
            href="https://github.com/weiyouzi321/seeing-llm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 underline"
          >
            GitHub
          </a>
          。
        </p>
      </section>
    </div>
  )
}