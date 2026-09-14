export function SiteFooter() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <footer className="border-t border-line bg-panel/40 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm text-fg-muted">
        <div>
          <div className="flex items-center gap-2 font-bold text-fg mb-2">
            <span className="inline-block w-4 h-4 rounded-sm bg-accent-bar" aria-hidden />
            seeing-llm
            <span className="font-mono text-xs text-fg-dim font-normal">看见大模型</span>
          </div>
          <p className="leading-relaxed">
            把&ldquo;大模型是怎么造出来的&rdquo;从论文与源码，变成可点、可拖、可算给你看的交互式教材。
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3">Tracks</div>
          <ul className="space-y-1.5">
            <li><a href={`${base}/architecture`} className="hover:text-neon transition">A · 架构解剖</a></li>
            <li><a href={`${base}/training`} className="hover:text-neon transition">B · 训练全流程</a></li>
            <li><a href={`${base}/ops`} className="hover:text-neon transition">C · 算子与策略</a></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">About</div>
          <ul className="space-y-1.5">
            <li><a href={`${base}/about`} className="hover:text-neon transition">关于本站</a></li>
            <li>
              <a
                href="https://github.com/weiyouzi321/seeing-llm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neon transition"
              >
                GitHub 仓库
              </a>
            </li>
            <li>
              <a href={`${base}/plan`} className="hover:text-neon transition">
                建设方案 v2.1
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-fg-dim flex justify-between flex-wrap gap-2">
          <span>© 2026 weiyouzi321 · 仅用于教育与研究</span>
          <span className="font-mono">v2.1 · 规格冻结</span>
        </div>
      </div>
    </footer>
  )
}
