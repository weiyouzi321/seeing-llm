import { AttentionScaling } from '@/components/AttentionScaling'
import { MoeRouting } from '@/components/opviz/Route'
import { CedFlow } from './CedFlow'
import { CsaModes } from './CsaModes'
import { DeltaRule } from './DeltaRule'
import { MtpDraft } from './MtpDraft'
import type { ModuleViz } from '@/lib/modules'

/**
 * 模块页可视化派发器。
 * 返回类型必须写 `JSX.Element | null` —— @types/react 18 下 ReactNode 不能用作 JSX 组件。
 */
export function ModuleVizView({ viz }: { viz: ModuleViz }): JSX.Element | null {
  switch (viz) {
    case 'attention-scaling':
      return <AttentionScaling />
    case 'moe-routing':
      return <MoeRouting />
    case 'ced-flow':
      return <CedFlow />
    case 'csa-modes':
      return <CsaModes />
    case 'delta-rule':
      return <DeltaRule />
    case 'mtp-draft':
      return <MtpDraft />
    default:
      return null
  }
}
