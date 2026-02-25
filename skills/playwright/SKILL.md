---
name: playwright
description: Playwright patterns for end-to-end testing including page object model, fixtures, locators, assertions, API testing, visual regression, and CI integration. Use when writing E2E tests, setting up Playwright, creating page objects, testing user flows, or when the user asks about end-to-end testing, browser testing, or Playwright configuration.
---

# Playwright Best Practices

## Setup

```shell
npm init playwright@latest
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "github" : "html",
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "mobile", use: { ...devices["iPhone 14"] } },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
    },
});
```

## Locators

Use user-facing locators for resilient tests:

```typescript
// Preferred (resilient)
page.getByRole("button", { name: "Submit" });
page.getByLabel("Email");
page.getByPlaceholder("Search...");
page.getByText("Welcome back");
page.getByTestId("user-avatar"); // last resort

// Avoid (brittle)
page.locator(".btn-primary");
page.locator("#submit-btn");
page.locator("div > span:nth-child(2)");
```

### Locator Priority

1. `getByRole` — buttons, links, headings, inputs (most accessible)
2. `getByLabel` — form fields
3. `getByPlaceholder` — inputs without visible labels
4. `getByText` — non-interactive elements
5. `getByTestId` — when no better option exists

### Filtering and Chaining

```typescript
page.getByRole("listitem").filter({ hasText: "Product 1" });
page.getByRole("list").getByRole("listitem").first();
page.getByRole("dialog").getByRole("button", { name: "Confirm" });
```

## Assertions

Playwright auto-waits for assertions to pass:

```typescript
// Element assertions
await expect(page.getByText("Success")).toBeVisible();
await expect(page.getByRole("button")).toBeEnabled();
await expect(page.getByLabel("Email")).toHaveValue("test@example.com");
await expect(page.getByRole("alert")).toContainText("Saved");
await expect(page.getByRole("listitem")).toHaveCount(5);

// Page assertions
await expect(page).toHaveURL("/dashboard");
await expect(page).toHaveTitle("Dashboard");
```

Never use manual `waitForTimeout` — use auto-waiting assertions and locators instead.

## Page Object Model

Encapsulate page interactions in classes:

```typescript
// e2e/pages/login-page.ts
import { type Locator, type Page, expect } from "@playwright/test";

export class LoginPage {
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly errorMessage: Locator;

    constructor(private page: Page) {
        this.emailInput = page.getByLabel("Email");
        this.passwordInput = page.getByLabel("Password");
        this.submitButton = page.getByRole("button", { name: "Sign in" });
        this.errorMessage = page.getByRole("alert");
    }

    async goto() {
        await this.page.goto("/login");
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async expectError(message: string) {
        await expect(this.errorMessage).toContainText(message);
    }
}
```

## Fixtures

Extend the base test with reusable setup:

```typescript
// e2e/fixtures.ts
import { test as base } from "@playwright/test";
import { LoginPage } from "./pages/login-page";
import { DashboardPage } from "./pages/dashboard-page";

type Fixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    dashboardPage: async ({ page }, use) => {
        await use(new DashboardPage(page));
    },
    authenticatedPage: async ({ page }, use) => {
        await page.goto("/login");
        await page.getByLabel("Email").fill("admin@test.com");
        await page.getByLabel("Password").fill("password");
        await page.getByRole("button", { name: "Sign in" }).click();
        await page.waitForURL("/dashboard");
        await use(page);
    },
});

export { expect } from "@playwright/test";
```

Use in tests:

```typescript
import { test, expect } from "./fixtures";

test("login with valid credentials", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login("user@test.com", "password123");
    await expect(page).toHaveURL("/dashboard");
});

test("dashboard shows user data", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByText("Welcome")).toBeVisible();
});
```

## Writing Tests

### Structure

```typescript
import { test, expect } from "./fixtures";

test.describe("User Registration", () => {
    test("creates account with valid data", async ({ page }) => {
        await page.goto("/register");
        await page.getByLabel("Name").fill("Alice");
        await page.getByLabel("Email").fill("alice@test.com");
        await page.getByLabel("Password").fill("securePass123");
        await page.getByRole("button", { name: "Create Account" }).click();

        await expect(page).toHaveURL("/dashboard");
        await expect(page.getByText("Welcome, Alice")).toBeVisible();
    });

    test("shows error for duplicate email", async ({ page }) => {
        await page.goto("/register");
        await page.getByLabel("Email").fill("existing@test.com");
        await page.getByLabel("Password").fill("password123");
        await page.getByRole("button", { name: "Create Account" }).click();

        await expect(page.getByRole("alert")).toContainText("already exists");
    });
});
```

### Principles

- Each test is independent — no shared state between tests.
- Test user-visible behavior, not implementation.
- Use auto-waiting — no `sleep()` or `waitForTimeout()`.
- One logical flow per test.

## API Testing

Test API endpoints directly:

```typescript
test("API creates a user", async ({ request }) => {
    const response = await request.post("/api/users", {
        data: { name: "Alice", email: "alice@test.com" },
    });

    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user.name).toBe("Alice");
});
```

### API Setup in Tests

Seed data via API before UI tests:

```typescript
test.beforeEach(async ({ request }) => {
    await request.post("/api/test/reset");
    await request.post("/api/users", {
        data: { name: "Test User", email: "test@test.com" },
    });
});
```

## Authentication State

Save and reuse auth state to avoid logging in every test:

```typescript
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@test.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/dashboard");
    await page.context().storageState({ path: authFile });
});
```

```typescript
// playwright.config.ts
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    dependencies: ["setup"],
    use: { storageState: "e2e/.auth/user.json" },
  },
],
```

## Visual Regression

```typescript
test("homepage matches snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage.png", {
        maxDiffPixelRatio: 0.01,
    });
});

test("button variants", async ({ page }) => {
    await page.goto("/storybook/button");
    await expect(page.getByTestId("button-group")).toHaveScreenshot();
});
```

Update snapshots: `npx playwright test --update-snapshots`.

## CI Integration

```yaml
# .github/workflows/e2e.yml
jobs:
    e2e:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: "npm" }
            - run: npm ci
            - run: npx playwright install --with-deps
            - run: npx playwright test
            - uses: actions/upload-artifact@v4
              if: ${{ !cancelled() }}
              with:
                  name: playwright-report
                  path: playwright-report/
                  retention-days: 7
```

## File Structure

```
e2e/
├── fixtures.ts          # custom test fixtures
├── pages/               # page objects
│   ├── login-page.ts
│   └── dashboard-page.ts
├── auth.setup.ts        # authentication setup
├── .auth/               # stored auth state (gitignored)
├── tests/
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── users.spec.ts
└── playwright.config.ts
```
