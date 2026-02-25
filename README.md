# @grahamcrackers/skills

> [!NOTE]
> These are just a list of technologies I use the most. See [skills.sh](https://skills.sh) for more skills.

A collection of agent skills for modern web development. These skills teach AI coding agents best practices, patterns, and conventions across the frontend stack — TypeScript, React, state management, styling, testing, and tooling.

## Install

```shell
npx skills add grahamcrackers/skills
```

### Install specific skills

```shell
npx skills add grahamcrackers/skills --skill react-best-practices --skill typescript-best-practices
```

### Install globally

```shell
npx skills add grahamcrackers/skills -g
```

## Skills

### Fundamentals

| Skill                                                  | Description                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [clean-code-principles](skills/clean-code-principles/) | Naming, functions, abstraction, composition, error handling, and code smells |

### TypeScript

| Skill                                                                | Description                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [typescript-best-practices](skills/typescript-best-practices/)       | Core conventions for type safety, inference, and clean code                           |
| [typescript-advanced-patterns](skills/typescript-advanced-patterns/) | Advanced type-level patterns: generics, branded types, discriminated unions, and more |

### React

| Skill                                                            | Description                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [react-best-practices](skills/react-best-practices/)             | Modern React 19 patterns for components, hooks, state, and performance       |
| [bulletproof-react-patterns](skills/bulletproof-react-patterns/) | Scalable architecture: feature-based structure, API layers, state boundaries |
| [react-hook-form](skills/react-hook-form/)                       | Performant forms with Zod validation, field arrays, and multi-step patterns  |
| [react-aria-components](skills/react-aria-components/)           | Accessible unstyled primitives: composition, styling, collections, overlays  |

### Routing

| Skill                                      | Description                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| [tanstack-router](skills/tanstack-router/) | Type-safe routing: file-based routes, search params, loaders, auth, code splitting |
| [react-router](skills/react-router/)       | React Router v7: nested routes, loaders, actions, params, code splitting           |

### State & Data

| Skill                                    | Description                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| [tanstack-query](skills/tanstack-query/) | TanStack Query v5 for server state, caching, mutations, and optimistic updates |
| [tanstack-table](skills/tanstack-table/) | TanStack Table v8 headless tables: columns, sorting, filtering, pagination     |
| [zustand](skills/zustand/)               | Client state management with slices, middleware, selectors, and persistence    |
| [state-machines](skills/state-machines/) | XState v5 state machines: guards, actions, parallel states, React integration  |
| [zod-validation](skills/zod-validation/) | Schema validation, API response parsing, form integration, and type inference  |

### Styling & Animation

| Skill                                  | Description                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| [tailwindcss](skills/tailwindcss/)     | Tailwind CSS v4: CSS-native config, theme variables, container queries, modern utilities    |
| [modern-css](skills/modern-css/)       | Cascade layers, `:has()`, `@scope`, view transitions, anchor positioning, scroll animations |
| [framer-motion](skills/framer-motion/) | Animation patterns: variants, layout animations, gestures, scroll-linked effects            |

### Tooling & Build

| Skill                                      | Description                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| [vite](skills/vite/)                       | Vite config: plugins, env vars, proxy, build optimization, library mode         |
| [eslint-9](skills/eslint-9/)               | ESLint 9 flat config, plugin setup, TypeScript integration, and migration       |
| [tsdown](skills/tsdown/)                   | Library bundling with Rolldown: formats, DTS, plugins, monorepo, tsup migration |
| [git-conventions](skills/git-conventions/) | Conventional commits, branching strategies, PR workflows, and merge strategies  |
| [changesets](skills/changesets/)           | Versioning, changelogs, npm publishing, CI automation, and monorepo releases    |
| [github-actions](skills/github-actions/)   | CI/CD workflows, caching, reusable workflows, composite actions, deployments    |

### Testing

| Skill                                    | Description                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| [vitest-testing](skills/vitest-testing/) | Vitest + Testing Library patterns for unit, component, and integration tests |
| [storybook](skills/storybook/)           | Component stories, args/controls, interaction testing, documentation         |
| [playwright](skills/playwright/)         | E2E testing: page objects, fixtures, locators, visual regression, CI         |
| [msw](skills/msw/)                       | API mocking for dev and tests: handlers, overrides, Storybook integration    |

### Accessibility & Security

| Skill                                                    | Description                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| [accessibility-patterns](skills/accessibility-patterns/) | WCAG compliance, ARIA, semantic HTML, keyboard navigation, focus management |
| [web-performance](skills/web-performance/)               | Core Web Vitals, bundle analysis, lazy loading, images, caching strategies  |
| [security-patterns](skills/security-patterns/)           | XSS prevention, CSP, CSRF, auth tokens, input validation, secure headers    |

## Compatibility

These skills work with any agent that supports the [Agent Skills specification](https://agentskills.io), including Cursor, Claude Code, Codex, Windsurf, Cline, GitHub Copilot, and many more.

## License

MIT
