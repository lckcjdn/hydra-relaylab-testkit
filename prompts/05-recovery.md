# 恢复原 Codex Session 的审查任务

你必须在**原生 Session ID 相同**的 Codex 会话中继续工作，不是新创建的 Codex 会话。Manager 已将 DSH 接力成果及其 Git diff/commit、测试证据同步给你。

在原工作目录（或从正确 Git base 合并的工作树）检查 DSH 的审计历史实现：接口契约、状态转移、错误路径、持久化、测试覆盖。不要假定异 Harness 的文本说明等价于实际文件状态。运行所有 baseline 与 acceptance，再运行根目录 `node scripts/integration-check.mjs`。

请给出明确的原 Session ID、当前 commit、测试结果、发现的问题、是否需要回滚以及后续任务。若无法确认原 Session ID 或同步成果，明确判定“Session 恢复未验证”，而不是说成功。
