// P0 占位图清单（前端查表用，与 manifests/images.json 保持一致）
// 真实原图在 P1/P3 阶段替换为真实架构图，文件名结构保持不变。

export const PLACEHOLDER_DIAGRAMS = [
  {
    id: 'k3_overall',
    model: 'K3',
    title: 'Kimi K3 整体架构',
    sub: '93 层 = 1 稠密 + 23 × (3 KDA + 1 Gated MLA)',
  },
  {
    id: 'v4_overall',
    model: 'V4',
    title: 'DeepSeek V4.1 Flash 整体架构',
    sub: 'CED · 20 编码 + 20 解码 · 552B MoE',
  },
  {
    id: 'qwen_overall',
    model: 'Qwen',
    title: 'Qwen3.8-2.4T-A95B 整体架构',
    sub: '92 层 = 23 × (3 Gated DeltaNet + 1 Gated Attention)',
  },
] as const

export type DiagramId = (typeof PLACEHOLDER_DIAGRAMS)[number]['id']

/**
 * basePath 前缀（构建时内联）
 *
 * ⚠️ 关键坑：原生 <img src> 和 fetch() 都 **不会** 自动加 basePath，
 *    只有 next/link 和 next/router 会。部署在 github.io 子路径下时，
 *    裸路径 `/images/...` 会 404。必须在这里显式拼接。
 *    参见 seeing-single-cell 的同类修复。
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

/**
 * 获取压缩产物的完整路径（含 basePath 前缀）
 */
export function getDiagramPath(id: DiagramId, tier: 'thumb' | 'md' | 'xl' = 'md'): string {
  return `${BASE}/images/${tier}/${id}.webp`
}