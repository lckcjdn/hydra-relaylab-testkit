# DSH 接力 Worker 提示词

你正在 relay-api 项目中使用一个独立且完整的 DSH Session。请读取 Manager 提供的 Codex Checkpoint、Git commit/patch 和测试结果，接手任务 B 第二阶段（HTTP history endpoint），但保留 Codex 已完成的存储层与测试。

禁止直接共写还在运行的 Codex 工作目录；使用独立 worktree 或先确认原 Session 已停止写入后再串行接力。

先验证基础测试，再只实现剩余功能；结束时运行 `npm test` 和 `npm run test:acceptance`，报告通过项/失败项、commit/patch、原 Codex 提供的 API 决策是否保留。

不要报告“原 Codex session 已恢复”。这由 Hydra 恢复环节单独验证。
