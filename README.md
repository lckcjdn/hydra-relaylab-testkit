# Hydra RelayLab — 可复现多 Harness Session 接力测试工作区

本包是用于验证 Hydra 的独立测试工程，**不是 Hydra 本体**，也不要求修改 Hydra 的生产代码。

## 项目结构

- `relay-api/`：Node 20+ 无第三方依赖的持久化 Ticket REST API；提供基线接口，并故意留出 A/B/C 三组待实现能力。
- `relay-client/`：独立 CLI 工程；留出 D 组统计与 CSV 导出能力。建议以独立 Git 仓库初始化。
- `ASSIGNMENTS.md`：要交给完整 Harness Session 的真实编码任务。
- `prompts/`：Manager、Codex、DSH、GLM、恢复验收的可复制提示词。
- `docs/TEST_PLAN.md`：详细步骤、分层测试、指标、故障注入与通过标准。
- `scripts/measure.mjs`：生成机器可读取的基线 / 验收测试报告 JSON。
- `scripts/init-repos.ps1`、`scripts/init-repos.sh`：分别初始化两个独立 Git 仓库。
- `reports/`：测试操作与证据记录模板（不保存凭据）。

## 首次执行（Windows PowerShell）

```powershell
node --version             # 要求 Node.js >=20
git --version
pwsh -File scripts/init-repos.ps1
node scripts/measure.mjs baseline
node scripts/measure.mjs acceptance
```

最后一条首次**预期失败**：验收用例先 RED，正是 Agent 需要完成的工作。`baseline` 必须成功。
如果未安装 PowerShell 7，可以在 Windows PowerShell 使用 `powershell -ExecutionPolicy Bypass -File scripts/init-repos.ps1`。

## macOS/Linux

```bash
bash scripts/init-repos.sh
node scripts/measure.mjs baseline
node scripts/measure.mjs acceptance   # 初始应该失败
```

## API 服务（另开终端）

```bash
cd relay-api
npm start
# GET http://127.0.0.1:4500/health
```

CLI：`cd relay-client && node bin/relay.mjs help`。

## Hydra 手动验证注意

1. Hydra -> Groups (`Ctrl+Shift+G`) 建组，例如 `RelayLab - Cross Harness`，项目路径分别指向 `relay-api` 和 `relay-client`。
2. 在 **Hydra New Agent** 真正启动 Codex、DSH 等 Harness 进程；再把取得的原生 Session ID 和相同 cwd 注册进 Group。**只在 Group 内 Add Session 是创建记录，不等于真实 spawn 一个 CLI Agent**。
3. 为避免同目录双写，使用各自 Git worktree 或串行修改并交接 commit/patch。独立仓库 `relay-api` 与 `relay-client` 自然隔离。
4. V1 `Suspend` 和 `Resume` 主要是编排生命周期登记；另行验证真实进程的停止 / 释放句柄 / 原生 Session Resume。不要把 `resume_pending` 误记为恢复成功。
5. 如果 Session 没有关联有效的 quota pool，可能显示 `no pool`；请先按实际功能建立或关联同一 provider/account 对应的池，再做 `Block quota` 测试。不要伪造“真实额度已耗尽”的证据。

更多细节与通过标准见 [docs/TEST_PLAN.md](docs/TEST_PLAN.md)。
