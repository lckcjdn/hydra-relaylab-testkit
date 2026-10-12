# Codex Worker 阶段一（受控接力起点）

你是 relay-api 项目的 Codex Worker，工作目录应当是该项目的真实 Git repo 或专属 worktree。

请先运行 `npm test` 验证 baseline，再阅读 `../ASSIGNMENTS.md` 中任务 B（Audit history）。本次只执行 **B 的第一阶段**：为 JSON 持久化结构加入历史记录所需的数据字段，并为下一阶段的 REST history endpoint 制定接口计划。**不要实现 `GET /tickets/:id/history`**，因为后续我们将有意模拟你的额度用尽，让 DSH 接力完成接口。

要求：不要弱化现有测试，保留尚未完成的 audit acceptance 为失败；完成第一阶段后保存 Git commit（或交付 patch），报告：原生 Session ID、分支与 commit、修改文件、已完成项、未完成项、验证命令与退出码。

你随后将由 Hydra 记录 Checkpoint 并模拟额度不足。不要清空你的会话，不要自行迁移到 DSH。
