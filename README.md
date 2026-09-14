# seeing-llm · 看见大模型

把"大模型是怎么造出来的"从论文与源码，变成**可点、可拖、可算给你看**的交互式教材。

聚焦 **Kimi K3**、**DeepSeek V4.1 Flash**、**Qwen3.8-2.4T-A95B** 三个最新最知名的开源旗舰。

## 站点

部署在 GitHub Pages：https://weiyouzi321.github.io/seeing-llm/

## 三轨信息架构

- **轨道 A · 架构解剖**：14 个模块页，每页一个"它为什么这样设计"的可拖可点组件
- **轨道 B · 训练全流程**：MiniMind 8 阶段可视时间线（P4）
- **轨道 C · 算子与策略**：TorchCode 高频前 20 个算子

## 技术栈

- Next.js 14.2.5（App Router · `output: 'export'` · `trailingSlash`）
- TypeScript 5.5.3 · Tailwind CSS 3.4.6
- 部署：GitHub Actions → `out/` → `peaceiris/actions-gh-pages` → `gh-pages`

## 本地开发

```bash
npm install
npm run dev                # http://localhost:3000
NODE_OPTIONS="--use-system-ca" npm run build   # 静态导出到 out/
npx serve out -l 3000      # 预览产物
```

## 建设方案

完整内容、设计、开发方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)（规格冻结版）。

## 许可

代码与内容采用 MIT 协议（仅本站原创部分）。站点引用的架构图、模型卡内容遵循原方许可（K3 为 Kimi K3 License）。

---

v2.1 · 规格冻结 · 2026-09-14