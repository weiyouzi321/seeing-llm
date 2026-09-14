/**
 * ModelId ↔ URL 段落 的唯一映射。
 *
 * 为什么单独一个文件：models.ts 只负责「规格事实」，
 * 路由命名属于站点结构，两者分开后改 URL 不必动数据。
 *
 * ⚠️ 改这里会改变全站 URL —— 别在没打算重定向的情况下动。
 */

import { MODEL_LIST, type ModelId } from './models'

export const MODEL_ROUTE: Record<ModelId, string> = {
  k3: 'kimi-k3',
  v4: 'deepseek-v4-flash',
  qwen: 'qwen3-8',
}

export const ROUTE_MODEL: Record<string, ModelId> = {
  'kimi-k3': 'k3',
  'deepseek-v4-flash': 'v4',
  'qwen3-8': 'qwen',
}

/** 静态导出用：generateStaticParams 的返回值 */
export const MODEL_PARAMS = MODEL_LIST.map((m) => ({ model: MODEL_ROUTE[m.id] }))

export function modelPath(id: ModelId): string {
  return `/architecture/${MODEL_ROUTE[id]}`
}

export function modulePath(id: ModelId, slug: string): string {
  return `${modelPath(id)}/${slug}`
}

export function getModelByRoute(route: string): ModelId | undefined {
  return ROUTE_MODEL[route]
}
