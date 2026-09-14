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
  return (
    <html lang="zh-CN">
      {/*
        不要加 <base href={basePath}>：
        Next.js 的 basePath 已让所有 <Link> 与静态资源输出绝对路径，<base> 反而会让
        相对路径与 #锚点 被错误解析到 /seeing-llm#xxx。
      */}
      <body className="min-h-screen bg-void text-fg">
        {/* 全站底纹：工业网格 + 顶部极光（固定，不随滚动） */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-aurora" />
        <SiteHeader />
        <main className="min-h-[calc(100vh-160px)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}