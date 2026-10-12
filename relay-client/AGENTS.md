# RelayLab Client worker instructions

Separate Git repository from relay-api, used for cross-project Agent Group tests.
- Implement only the assigned client workstream. Do not edit the API project unless explicitly instructed.
- Baseline: `npm test`; acceptance: `npm run test:acceptance` (initially RED by design).
- Do not weaken the acceptance tests. Deliver commit SHA, tests, and CLI usage output.
- Client `stats` and `export` must be usable against the relay-api endpoint.
