---
name: github-actions
description: GitHub Actions best practices for CI/CD workflows including job structure, caching, reusable workflows, composite actions, matrix builds, secrets management, and common pipeline patterns. Use when writing GitHub Actions workflows, setting up CI/CD, optimizing builds, creating reusable actions, or when the user asks about GitHub Actions, workflows, or deployment automation.
---

# GitHub Actions Best Practices

## Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true

jobs:
    lint:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: "npm"
            - run: npm ci
            - run: npm run lint

    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: "npm"
            - run: npm ci
            - run: npm test
```

### Key Principles

- **Always set `concurrency`** with `cancel-in-progress: true` on PR workflows — avoids wasting runners on outdated commits.
- **Pin action versions** to a major tag (`@v4`) or full SHA for security-critical actions. Never use `@main` or `@latest`.
- **Use `npm ci`** (or `pnpm install --frozen-lockfile`) instead of `npm install` — ensures deterministic installs from the lockfile.

## Caching

### Node.js Dependencies

The built-in cache in `actions/setup-node` handles most cases:

```yaml
- uses: actions/setup-node@v4
  with:
      node-version: 20
      cache: "npm" # or "pnpm" or "yarn"
```

### Custom Caching

For build outputs, Playwright browsers, or other artifacts:

```yaml
- uses: actions/cache@v4
  with:
      path: |
          .next/cache
          node_modules/.cache
      key: ${{ runner.os }}-build-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
          ${{ runner.os }}-build-
```

### Turbo Cache

For Turborepo monorepos:

```yaml
- uses: actions/cache@v4
  with:
      path: .turbo
      key: ${{ runner.os }}-turbo-${{ github.sha }}
      restore-keys: |
          ${{ runner.os }}-turbo-
```

## Parallel Jobs

Split independent checks into separate jobs for faster feedback:

```yaml
jobs:
    lint:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: "npm" }
            - run: npm ci
            - run: npm run lint

    typecheck:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: "npm" }
            - run: npm ci
            - run: npm run typecheck

    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: "npm" }
            - run: npm ci
            - run: npm test

    build:
        needs: [lint, typecheck, test]
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: "npm" }
            - run: npm ci
            - run: npm run build
```

Use `needs` to gate deployment on all checks passing.

## Matrix Builds

Test across multiple versions or platforms:

```yaml
jobs:
    test:
        runs-on: ${{ matrix.os }}
        strategy:
            matrix:
                os: [ubuntu-latest, macos-latest]
                node-version: [18, 20, 22]
            fail-fast: false
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: ${{ matrix.node-version }}
                  cache: "npm"
            - run: npm ci
            - run: npm test
```

- Set `fail-fast: false` to run all combinations even if one fails.
- Use `include` and `exclude` to fine-tune the matrix.

## Reusable Workflows

Extract common workflow patterns into callable workflows:

```yaml
# .github/workflows/reusable-ci.yml
name: Reusable CI

on:
    workflow_call:
        inputs:
            node-version:
                type: number
                default: 20
        secrets:
            NPM_TOKEN:
                required: false

jobs:
    ci:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: ${{ inputs.node-version }}
                  cache: "npm"
            - run: npm ci
            - run: npm run lint
            - run: npm test
            - run: npm run build
```

Call it from another workflow:

```yaml
# .github/workflows/ci.yml
jobs:
    ci:
        uses: ./.github/workflows/reusable-ci.yml
        with:
            node-version: 20
        secrets: inherit
```

- Use `workflow_call` trigger for reusable workflows.
- `secrets: inherit` passes all secrets from the caller.
- Reusable workflows can live in the same repo or a shared org repo.

## Composite Actions

Bundle repeated steps into a single reusable action:

```yaml
# .github/actions/setup-project/action.yml
name: "Setup Project"
description: "Checkout, setup Node, and install dependencies"
inputs:
    node-version:
        description: "Node.js version"
        default: "20"
runs:
    using: "composite"
    steps:
        - uses: actions/checkout@v4
          shell: bash
        - uses: actions/setup-node@v4
          with:
              node-version: ${{ inputs.node-version }}
              cache: "npm"
          shell: bash
        - run: npm ci
          shell: bash
```

Use in any workflow:

```yaml
steps:
    - uses: ./.github/actions/setup-project
      with:
          node-version: 20
    - run: npm test
```

### When to Use Each

| Pattern           | Use When                                                     |
| ----------------- | ------------------------------------------------------------ |
| Composite action  | Reusing a group of steps within a job                        |
| Reusable workflow | Reusing entire jobs with their own runners                   |
| Workflow template | Providing starting-point workflows for new repos (org-level) |

## Secrets and Security

- **Never hardcode secrets** — use `${{ secrets.SECRET_NAME }}`.
- **Use environment protection rules** for production deployments (require approvals, limit branches).
- **Minimize permissions** with the `permissions` key:

```yaml
permissions:
    contents: read
    pull-requests: write
```

- **Audit third-party actions** before using them. Pin to a full SHA for critical workflows:

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

- **Use `${{ github.token }}`** (auto-provisioned) instead of personal access tokens when possible.

## Environment-Based Deployments

```yaml
jobs:
    deploy-staging:
        runs-on: ubuntu-latest
        environment: staging
        steps:
            - uses: actions/checkout@v4
            - run: npm ci && npm run build
            - run: npx deploy --env staging

    deploy-production:
        needs: deploy-staging
        runs-on: ubuntu-latest
        environment:
            name: production
            url: https://myapp.com
        steps:
            - uses: actions/checkout@v4
            - run: npm ci && npm run build
            - run: npx deploy --env production
```

Configure environment protection rules in GitHub settings to require manual approval before production deploys.

## Path Filtering

Run workflows only when relevant files change:

```yaml
on:
    push:
        paths:
            - "src/**"
            - "package.json"
            - "package-lock.json"
        paths-ignore:
            - "docs/**"
            - "**.md"
```

For monorepos, use path filters to run only affected package checks.

## Artifacts

Share files between jobs:

```yaml
jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - run: npm ci && npm run build
            - uses: actions/upload-artifact@v4
              with:
                  name: build-output
                  path: dist/
                  retention-days: 1

    deploy:
        needs: build
        runs-on: ubuntu-latest
        steps:
            - uses: actions/download-artifact@v4
              with:
                  name: build-output
                  path: dist/
            - run: npx deploy dist/
```

Set `retention-days` to avoid accumulating large artifacts.

## Common Patterns

### PR Preview Deploys

```yaml
on:
    pull_request:
        types: [opened, synchronize]

jobs:
    preview:
        runs-on: ubuntu-latest
        permissions:
            pull-requests: write
        steps:
            - uses: actions/checkout@v4
            - run: npm ci && npm run build
            - id: deploy
              run: echo "url=$(npx deploy --preview)" >> $GITHUB_OUTPUT
            - uses: actions/github-script@v7
              with:
                  script: |
                      github.rest.issues.createComment({
                        issue_number: context.issue.number,
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        body: `Preview deployed: ${{ steps.deploy.outputs.url }}`
                      })
```

### Scheduled Jobs

```yaml
on:
    schedule:
        - cron: "0 9 * * 1" # Every Monday at 9am UTC

jobs:
    dependency-audit:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - run: npm audit --production
```

### Release on Tag

```yaml
on:
    push:
        tags:
            - "v*"

jobs:
    release:
        runs-on: ubuntu-latest
        permissions:
            contents: write
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  registry-url: "https://registry.npmjs.org"
            - run: npm ci && npm run build
            - run: npm publish
              env:
                  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
            - uses: softprops/action-gh-release@v2
              with:
                  generate_release_notes: true
```

## Debugging

- **Enable debug logging**: Set the `ACTIONS_RUNNER_DEBUG` repository secret to `true`.
- **Use `act`** for local testing: `act push` simulates a push event locally.
- **Add diagnostic steps** when debugging:

```yaml
- run: |
      echo "Event: ${{ github.event_name }}"
      echo "Ref: ${{ github.ref }}"
      echo "SHA: ${{ github.sha }}"
      echo "Actor: ${{ github.actor }}"
```

## Anti-Patterns

- **Don't install dependencies in every job** without caching — use `actions/setup-node` with `cache` or a composite setup action.
- **Don't use `@master` or `@main`** for action versions — pin to a tagged release.
- **Don't store secrets in workflow files** or commit them to the repo.
- **Don't run all checks sequentially** — parallelize independent jobs.
- **Don't skip `concurrency`** on PR workflows — stale runs waste minutes and can deploy outdated code.
