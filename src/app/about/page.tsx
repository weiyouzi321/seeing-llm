import Link from 'next/link'
import { MODEL_LIST } from '@/lib/models'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const SHORT: Record<string, string> = { k3: 'K3', v4: 'V4.1', qwen: 'Q3.8' }

export const metadata = {
  title: '关于 · seeing-llm',
  description: 'seeing-llm 的定位、数据来源与许可说明。',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">About</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-6">关于 seeing-llm</h1>

      <p className="text-lg text-fg-muted leading-relaxed mb-10">
        seeing-llm 是 <span className="text-fg">seeing-single-cell</span> 的姊妹站。
        把&ldquo;大模型是怎么造出来的&rdquo;从论文与源码里拎出来，
        变成可点、可拖、可算给你看的交互式教材。
      </p>

      {/* 定位 */}
      <h2 className="text-xl font-bold mb-4">站点定位</h2>
      <div className="panel divide-y divide-line mb-12">
        <Row no>
          <strong>不</strong>做在线判题 —— 静态导出，没有后端
        </Row>
        <Row no>
          <strong>不</strong>做真实模型推理 —— 一律用预计算结果
        </Row>
        <Row yes>
          <strong>是</strong>一个「理解场」：把论文里被折叠起来的细节，用可视化、动画、滑块重新展开
        </Row>
      </div>

      {/* 焦点模型 */}
      <h2 className="text-xl font-bold mb-4">三个焦点模型（数据核实于 2026-09-14）</h2>
      <div className="space-y-3 mb-12">
        {MODEL_LIST.map((m) => (
          <div key={m.id} className="panel p-4 flex gap-4 items-start">
            <span
              className="font-mono text-[11px] font-bold px-2 py-1 rounded shrink-0"
              style={{ background: `${m.hex}1F`, color: m.hex }}
            >
              {SHORT[m.id]}
            </span>
            <div>
              <div className="font-semibold mb-0.5">{m.fullName}</div>
              <div className="text-sm text-fg-muted leading-relaxed">
                {m.params.total}
                {m.id !== 'v4' ? ` / ${m.params.active}` : `（${m.params.active}）`}
                {' · '}
                {m.arch.formula}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片与许可 */}
      <h2 className="text-xl font-bold mb-4">图片与许可</h2>
      <div className="panel p-5 mb-12">
        <p className="text-fg-muted leading-relaxed mb-3">
          站点使用的架构原图均来自模型卡、技术报告等官方渠道，按教育与研究用途引用。
          所有原图经压缩流水线处理（三档 webp：thumb 800 / md 1600 / xl 2400），
          <span className="text-fg">原始大图不入库</span>。
        </p>
        <p className="text-fg-muted leading-relaxed">
          <strong className="text-k3">Kimi K3</strong> 的代码与权重遵循{' '}
          <span className="font-mono text-fg">Kimi K3 License</span>（非 MIT/Apache）：
          MaaS 业务连续 12 个月营收 &gt; 2000 万美元需另签，月活 &gt; 1 亿或月营收 &gt; 2000 万美元需显著署名。
          本站为非商业教育用途，各页均保留来源标注。
        </p>
      </div>

      {/* 技术底座 */}
      <h2 className="text-xl font-bold mb-4">技术底座</h2>
      <div className="panel p-5 mb-12">
        <p className="text-fg-muted leading-relaxed mb-3">
          Next.js 14 静态导出（<span className="font-mono text-fg">output: &apos;export&apos;</span>）+
          GitHub Actions → <span className="font-mono text-fg">gh-pages</span> 分支 → GitHub Pages。
          架构复用 seeing-single-cell 的成熟链路。
        </p>
        <p className="text-fg-muted leading-relaxed">
          性能上有一条硬约束：<span className="text-fg">凡是「输入确定、结果确定」的计算，一律离线预计算成小 JSON</span>，
          前端只读不算。这条来自 seeing-single-cell 第六章的教训 —— 曾在浏览器主线程跑 300×2000 的 PCA，
          页面假死被判定为「加载失败」。
        </p>
      </div>

      {/* 更多 */}
      <h2 className="text-xl font-bold mb-4">更多</h2>
      <p className="text-fg-muted leading-relaxed">
        完整的建设方案见{' '}
        <Link href={`${base}/plan`} className="text-neon underline underline-offset-4">
          v2.1
        </Link>
        ，源码与数据见{' '}
        <a
          href="https://github.com/weiyouzi321/seeing-llm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon underline underline-offset-4"
        >
          GitHub 仓库
        </a>
        。
      </p>
    </div>
  )
}

function Row({ children, yes, no }: { children: React.ReactNode; yes?: boolean; no?: boolean }) {
  const color = yes ? 'text-neon' : no ? 'text-fg-dim' : 'text-fg'
  return (
    <div className="p-4 flex items-start gap-3 text-sm">
      <span className={`font-mono text-xs mt-0.5 ${color}`}>{yes ? '✔' : '✘'}</span>
      <span className="text-fg-muted leading-relaxed">{children}</span>
    </div>
  )
}
