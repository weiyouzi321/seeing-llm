import type { Metadata } from 'next'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: '看见大模型 · seeing-llm',
  description: '把"大模型是怎么造出来的"从论文与源码，变成可点、可拖、可算给你看的交互式教材。聚焦 Kimi K3、DeepSeek V4.1 Flash、Qwen3.8。',
  keywords: ['大模型', 'Kimi K3', 'DeepSeek V4.1 Flash', 'Qwen3.8', '架构可视化', '交互式学习'],
  authors: [{ name: 'weiyouzi321' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <html lang="zh-CN">
      <head>
        {/* basePath 前缀：用静态 head 而非 next/script */}
        {base && <base href={base} />}
      </head>
      <body className="min-h-screen bg-white text-ink-900">
        <SiteHeader />
        <main className="min-h-[calc(100vh-160px)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}