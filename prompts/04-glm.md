# GLM Worker（跨项目）

你是 relay-client 独立 Git 仓库里的 Worker（可以运行在 DSH 的 GLM 路由上）。阅读 `../ASSIGNMENTS.md` 的任务 D。

只在 relay-client 目录实现 `stats` 与 `export --output`，先运行 `npm test`，最后验证 `npm run test:acceptance` 全部通过。不要编辑 relay-api；跨项目 API 契约由根目录 ASSIGNMENTS 说明。

提交 commit SHA、全部测试命令的退出码、原生 Session ID，供 Manager 后续分发新的 Task；下一任务优先复用当前 Session。
