export function SiteFooter() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <footer className="border-t border-ink-200 bg-ink-50 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm text-ink-600">
        <div>
          <div className="font-bold text-ink-900 mb-2">seeing-llm · 看见大模型</div>
          <p className="leading-relaxed">
            把"大模型是怎么造出来的"从论文与源码，变成可点、可拖、可算给你看的交互式教材。
          </p>
        </div>
        <div>
          <div className="font-bold text-ink-900 mb-2">轨道</div>
          <ul className="space-y-1">
            <li><a href={`${base}/architecture`} className="hover:text-primary-600">A · 架构解剖</a></li>
            <li><a href={`${base}/training`} className="hover:text-primary-600">B · 训练全流程</a></li>
            <li><a href={`${base}/ops`} className="hover:text-primary-600">C · 算子与策略</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-ink-900 mb-2">关于</div>
          <ul className="space-y-1">
            <li><a href={`${base}/about`} className="hover:text-primary-600">关于本站</a></li>
            <li>
              <a
                href="https://github.com/weiyouzi321/seeing-llm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600"
              >
                GitHub 仓库
              </a>
            </li>
            <li>
              <a
                href={`${base}/plan`}
                className="hover:text-primary-600"
              >
                建设方案 v2.1
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-200">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-ink-500 flex justify-between">
          <span>© 2026 weiyouzi321 · 仅用于教育与研究</span>
          <span className="font-mono">v2.1 · 规格冻结</span>
        </div>
      </div>
    </footer>
  )
}