# Fixture preflight verification

Date: 2026-10-12 (test kit build)

Validated in the sandbox with Node.js built-in test runner:

- `relay-api`: baseline 2/2 PASS; acceptance 1 PASS, 4 expected FAIL (unimplemented workstreams A/B/C).
- `relay-client`: baseline 2/2 PASS; acceptance 0 PASS, 2 expected FAIL (unimplemented workstream D).
- `scripts/init-repos.sh`: successfully creates two independent Git repositories with fixture commits.
- `scripts/audit-snapshot.mjs`: read-only synthetic empty-state check PASS.

The suite's initial red state is intentional. This is *not* proof that Hydra itself passed its orchestration E2E tests; use `docs/TEST_PLAN.md` to run those against the user's Hydra instance.
