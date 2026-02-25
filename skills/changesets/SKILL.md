---
name: changesets
description: Changesets best practices for versioning, changelogs, and publishing npm packages in single-package and monorepo projects. Covers the changeset workflow, semver conventions, CI automation with GitHub Actions, and monorepo dependency management. Use when managing package releases, writing changesets, publishing to npm, configuring changelogs, or when the user asks about changesets, versioning, or release workflows.
---

# Changesets Best Practices

## Overview

Changesets is a file-based approach to versioning and changelog management. Instead of deciding versions at release time, contributors declare their changes as they work — each change gets a markdown file describing what changed and the semver bump type.

## Setup

```shell
npm install -D @changesets/cli
npx changeset init
```

This creates a `.changeset/` directory with a `config.json`.

### Configuration

```jsonc
// .changeset/config.json
{
    "changelog": "@changesets/cli/changelog",
    "commit": false,
    "fixed": [],
    "linked": [],
    "access": "public",
    "baseBranch": "main",
    "updateInternalDependencies": "patch",
    "ignore": [],
}
```

| Option                       | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `changelog`                  | Changelog generator (use `@changesets/changelog-github` for PR/author links) |
| `commit`                     | Auto-commit version bumps and changelog updates                              |
| `fixed`                      | Groups of packages that always share the same version                        |
| `linked`                     | Groups of packages whose versions stay in sync for matching bump types       |
| `access`                     | `"public"` for public npm, `"restricted"` for private                        |
| `baseBranch`                 | Branch that releases are made from                                           |
| `updateInternalDependencies` | How to bump dependents when a dependency changes                             |
| `ignore`                     | Packages to exclude from changesets                                          |

## Core Workflow

### 1. Add a Changeset

When you make a change worth documenting:

```shell
npx changeset
```

This prompts you to:

1. Select which packages are affected.
2. Choose the semver bump type for each (`major`, `minor`, `patch`).
3. Write a summary of the change.

It creates a markdown file in `.changeset/`:

```markdown
---
"@myorg/ui": minor
"@myorg/utils": patch
---

Add new DatePicker component with timezone support.
Updated date formatting utilities to handle timezone offsets.
```

### 2. Version Packages

When ready to release:

```shell
npx changeset version
```

This:

- Consumes all changeset files in `.changeset/`.
- Bumps `package.json` versions based on the highest bump type per package.
- Updates `CHANGELOG.md` for each affected package.
- Bumps internal dependents as needed.

### 3. Publish

```shell
npx changeset publish
```

Publishes all packages with new versions to npm. Run after committing the version bump changes.

## Writing Good Changeset Summaries

Changeset summaries end up in your `CHANGELOG.md` — write them for consumers, not for yourself:

```markdown
## <!-- Good: explains the impact -->

## "@myorg/button": minor

Add `loading` prop to Button component. When `true`, displays a spinner
and disables the button to prevent duplicate submissions.
```

```markdown
## <!-- Bad: describes implementation, not impact -->

## "@myorg/button": minor

Added useState for loading state and conditional rendering of Spinner component.
```

### Guidelines

- Write in imperative mood: "Add feature" not "Added feature".
- Focus on what changed from the consumer's perspective.
- Mention breaking changes explicitly and include migration steps.
- One changeset per logical change — don't bundle unrelated changes.
- Include code examples for API changes:

```markdown
---
"@myorg/config": major
---

Change `createConfig` to accept an options object instead of positional arguments.

Before:
\`\`\`ts
createConfig("production", true, 3000);
\`\`\`

After:
\`\`\`ts
createConfig({ env: "production", debug: true, port: 3000 });
\`\`\`
```

## Semver Conventions

| Bump    | When                                              | Examples                                                           |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `patch` | Bug fixes, internal refactors, dependency updates | Fix null check, update devDependency                               |
| `minor` | New features, non-breaking additions              | Add prop, export new utility, add optional parameter               |
| `major` | Breaking changes                                  | Remove/rename export, change function signature, drop Node version |

When in doubt between minor and patch, ask: "Would a consumer need to change their code?" If no, it's a patch.

## GitHub Changelog Generator

Use `@changesets/changelog-github` for richer changelogs with PR links and author attribution:

```shell
npm install -D @changesets/changelog-github
```

```jsonc
// .changeset/config.json
{
    "changelog": ["@changesets/changelog-github", { "repo": "grahamcrackers/my-package" }],
}
```

This produces changelogs like:

```markdown
## 2.1.0

### Minor Changes

- Add DatePicker component ([#142](https://github.com/org/repo/pull/142)) — @grahamcrackers
```

## CI Automation with GitHub Actions

### Automated Version PRs and Publishing

Use the official `changesets/action` to automate the release workflow:

```yaml
# .github/workflows/release.yml
name: Release

on:
    push:
        branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
    release:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            pull-requests: write
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  registry-url: "https://registry.npmjs.org"

            - run: npm ci

            - uses: changesets/action@v1
              with:
                  publish: npm run release
                  title: "chore: version packages"
                  commit: "chore: version packages"
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
                  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This action:

- Detects pending changesets on main.
- Opens a "Version Packages" PR that bumps versions and updates changelogs.
- When the PR is merged, publishes to npm automatically.

### Require Changesets in PRs

Add a check that PRs include a changeset when source code changes:

```yaml
# .github/workflows/changeset-check.yml
name: Changeset Check

on:
    pull_request:
        branches: [main]

jobs:
    check:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
              with:
                  fetch-depth: 0

            - uses: actions/setup-node@v4
              with:
                  node-version: 20

            - run: npm ci
            - run: npx changeset status --since=origin/main
```

### Empty Changesets

For PRs that don't need a version bump (docs, CI, tests), add an empty changeset:

```shell
npx changeset --empty
```

This creates a changeset with no packages selected, satisfying CI checks without triggering a release.

## Monorepo Patterns

### Fixed Versioning

Packages that should always share the same version:

```jsonc
{
    "fixed": [["@myorg/core", "@myorg/cli", "@myorg/types"]],
}
```

When any package in the group bumps, all packages bump to the same version.

### Linked Versioning

Packages whose versions stay in sync for the same bump type, but can diverge:

```jsonc
{
    "linked": [["@myorg/react", "@myorg/vue", "@myorg/svelte"]],
}
```

If `@myorg/react` gets a minor bump, all linked packages that also have changesets get the same minor version.

### Internal Dependencies

When package A depends on package B and B gets a major bump:

- A automatically gets a patch bump (configurable via `updateInternalDependencies`).
- A's dependency on B is updated to the new version.

### Ignoring Packages

Exclude packages that aren't published (apps, internal tooling):

```jsonc
{
    "ignore": ["@myorg/web-app", "@myorg/internal-scripts"],
}
```

## Snapshot Releases

Publish pre-release versions for testing without consuming changesets:

```shell
npx changeset version --snapshot canary
npx changeset publish --tag canary
```

This produces versions like `0.0.0-canary-20260224` and publishes under the `canary` npm tag so `npm install @myorg/ui` still gets the stable release.

## Pre-releases

For alpha/beta/rc release channels:

```shell
npx changeset pre enter beta
# Now all `changeset version` calls produce beta versions (e.g., 2.0.0-beta.0)
# Continue adding changesets and versioning as normal

npx changeset pre exit
# Exit pre-release mode and release stable versions
```

## File Structure

```
.changeset/
├── config.json                     # configuration
├── README.md                       # auto-generated docs
├── fuzzy-dolphins-arrive.md        # pending changeset
└── brave-tigers-dance.md           # pending changeset
```

Changeset filenames are randomly generated — commit them as-is. They're consumed and deleted when you run `changeset version`.
