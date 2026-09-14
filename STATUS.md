# P0 进度快照

> 这是 P0（项目骨架 + 图片流水线）阶段的工作日志快照。
> 完整建设方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)。

## 已完成

- [x] Next.js 14.2.5 + TS 5.5.3 + Tailwind 3.4.6 项目骨架
- [x] 新视觉系统（深空蓝紫 + 电光青，与 seeing-single-cell 区分）
- [x] 首页 hero + 三轨入口卡 + 横向专题预告 + 焦点模型图卡
- [x] 占位子页：/architecture、/training、/ops、/about、/plan
- [x] GitHub Actions 部署工作流（deploy.yml，含安全护栏）
- [x] README.md / README.zh-CN.md / LICENSE
- [x] 图片流水线脚本（fetch_raw / make_placeholder / compress）
- [x] 压缩流水线验证：5 张原图 20.85 MB → 0.95 MB（4.6%）

## 待完成（依赖外部条件）

- [ ] GitHub 仓库创建（用户在网页手动创建）
- [ ] **本地依赖安装：沙箱限制**
  - `npm install` 触发 `wsl.exe` 被沙箱黑名单拦截
  - `bun install` 卡在 "Resolving dependencies"，疑似沙箱网络策略导致 npm registry 解析失败
  - **应对**：跳过本地构建验证，直接推送。CI（GitHub Actions runner）不受沙箱限制，会自行 install + build。
- [ ] 本地构建验证（待 bun install 完成后执行）
- [ ] 推送 + 部署验证

## 关键数据

| 项 | 值 |
|---|---|
| 总文件数（含方案） | 20 |
| 源码行数（src/） | ~330 |
| 图片流水线压缩比 | 20.85 MB → 0.95 MB（4.6%） |
| 站点 basePath | `/seeing-llm` |
| 占位图张数 | 5 |
| 占位图总原图体积 | 20.85 MB |
| 占位图压缩后总积 | 0.95 MB |