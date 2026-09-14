'use client'

import type { Op } from '@/lib/ops'
import { AttentionScaling } from '@/components/AttentionScaling'
import { ActivationCurves, DropoutDemo, LossDemo, NormDemo, SoftmaxTemp } from './Curves'
import { CausalMask } from './Mask'
import { KvCacheDemo } from './Kv'
import { MoeRouting } from './Route'
import { RopeDial } from './Rope'
import { SampleDemo } from './Sample'
import { ConvSweep, GqaHeads, ShapeFlow } from './Tensors'

/**
 * 按算子 slug 派发可视化。
 * 没配可视化的算子（beam-search / linear-regression）返回 null ——
 * 页面会退化为纯文字 + 代码，不强塞一个凑数的图。
 */
export function OpViz({ op }: { op: Op }): JSX.Element | null {
  const flow = op.io && op.io.length > 0 ? <ShapeFlow io={op.io} /> : null

  switch (op.slug) {
    case 'relu':
      return <ActivationCurves />
    case 'softmax':
      return <SoftmaxTemp />
    case 'layer-norm':
      return <NormDemo />
    case 'dropout':
      return <DropoutDemo />
    case 'cross-entropy':
      return <LossDemo />
    case 'rope':
      return <RopeDial />
    case 'sdpa':
      return <CausalMask initialMask={false} />
    case 'causal-attention':
      return <CausalMask initialMask />
    case 'top-k-top-p':
      return <SampleDemo />
    case 'kv-cache':
      return <KvCacheDemo />
    case 'moe-routing':
      return <MoeRouting />
    case 'conv2d':
      return (
        <div className="space-y-6">
          <ConvSweep />
          {flow}
        </div>
      )
    case 'multihead-attention':
    case 'gqa':
      return (
        <div className="space-y-6">
          <GqaHeads />
          {flow}
        </div>
      )
    case 'linear-attention':
      return (
        <div className="space-y-6">
          <AttentionScaling />
          {flow}
        </div>
      )
    case 'linear':
    case 'embedding':
    case 'gpt2-block':
      return flow
    default:
      return null
  }
}

