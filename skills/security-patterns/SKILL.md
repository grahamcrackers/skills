---
name: security-patterns
description: Frontend security patterns including XSS prevention, Content Security Policy, CSRF protection, input sanitization, authentication token handling, dependency auditing, and secure headers. Use when hardening a web app, handling user input, managing auth tokens, configuring CSP, or when the user asks about web security, XSS, CSRF, or secure coding practices.
---

# Frontend Security Patterns

## XSS Prevention

### React's Built-In Protection

React escapes all values rendered in JSX by default. This is safe:

```tsx
<p>{userInput}</p>                    // escaped — safe
<div title={userInput}>...</div>      // escaped — safe
```

### Dangerous Patterns

```tsx
// DANGEROUS — renders raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// DANGEROUS — inline event handlers from user data
<a href={userProvidedUrl}>Link</a>    // javascript: URLs are dangerous

// DANGEROUS — dynamic script injection
document.innerHTML = userInput;
element.insertAdjacentHTML("beforeend", userInput);
```

### Mitigations

Sanitize HTML when you must render user-provided markup:

```typescript
import DOMPurify from "dompurify";

const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
  ALLOWED_ATTR: ["href", "title"],
});

<div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
```

Validate URLs before rendering:

```typescript
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

<a href={isSafeUrl(url) ? url : "#"}>Link</a>
```

## Content Security Policy (CSP)

### HTTP Header

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Meta Tag (Fallback)

```html
<meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
/>
```

### Key Directives

| Directive         | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `default-src`     | Fallback for all resource types                 |
| `script-src`      | Allowed script sources                          |
| `style-src`       | Allowed style sources                           |
| `connect-src`     | Allowed fetch/XHR/WebSocket targets             |
| `img-src`         | Allowed image sources                           |
| `frame-ancestors` | Who can embed this page (`'none'` = no iframes) |
| `base-uri`        | Restricts `<base>` tag URLs                     |
| `form-action`     | Restricts form submission targets               |

Start strict (`default-src 'self'`) and whitelist only what's needed. Use `report-uri` or `report-to` to monitor violations in production before enforcing.

## CSRF Protection

### Token-Based

Include a CSRF token in state-changing requests:

```typescript
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

fetch("/api/transfer", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
});
```

### SameSite Cookies

```
Set-Cookie: session=abc123; SameSite=Lax; Secure; HttpOnly; Path=/
```

- `SameSite=Lax` — cookie sent on top-level navigations but not cross-site subrequests (default in modern browsers).
- `SameSite=Strict` — cookie never sent cross-site (may break OAuth flows).
- Always combine with `Secure` (HTTPS only) and `HttpOnly` (no JS access).

## Authentication Token Handling

### Storage Options

| Storage           | XSS Risk                        | CSRF Risk               | Use When                 |
| ----------------- | ------------------------------- | ----------------------- | ------------------------ |
| `HttpOnly` cookie | None (not accessible to JS)     | Mitigated with SameSite | Server can set cookies   |
| `localStorage`    | High (accessible to any script) | None                    | Never for auth tokens    |
| Memory (variable) | Low (cleared on page close)     | None                    | Short-lived SPA sessions |

**Prefer `HttpOnly` cookies** for auth tokens — they're invisible to JavaScript and automatically sent with requests.

### Token Refresh

```typescript
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, { ...options, credentials: "include" });

    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;
            await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            isRefreshing = false;
            pendingRequests.forEach((cb) => cb());
            pendingRequests = [];
        }

        return new Promise<Response>((resolve) => {
            pendingRequests.push(() => {
                resolve(fetch(url, { ...options, credentials: "include" }));
            });
        });
    }

    return response;
}
```

### Logout

Clear tokens and invalidate the session on the server:

```typescript
async function logout() {
    await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });
    window.location.href = "/login";
}
```

## Input Validation

Always validate on both client and server — client validation is for UX, server validation is for security.

```typescript
import { z } from "zod";

const UserInputSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email().max(254),
    bio: z.string().max(500).optional(),
    website: z
        .string()
        .url()
        .optional()
        .refine((url) => !url || /^https?:/.test(url), "Must be an HTTP(S) URL"),
});
```

Never trust client-side validation alone — always validate and sanitize on the server.

## Secure Headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

| Header                            | Purpose                          |
| --------------------------------- | -------------------------------- |
| `Strict-Transport-Security`       | Force HTTPS                      |
| `X-Content-Type-Options: nosniff` | Prevent MIME type sniffing       |
| `X-Frame-Options: DENY`           | Prevent clickjacking via iframes |
| `Referrer-Policy`                 | Control referer header leakage   |
| `Permissions-Policy`              | Disable unused browser APIs      |

## Dependency Security

### Audit Regularly

```shell
npm audit
npm audit --production  # only production deps
```

### Automated Scanning

Enable GitHub Dependabot or Snyk for automated vulnerability alerts:

```yaml
# .github/dependabot.yml
version: 2
updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
          interval: "weekly"
      open-pull-requests-limit: 10
```

### Lock Files

Always commit lock files (`package-lock.json`, `pnpm-lock.yaml`). Use `npm ci` in CI to install from the lockfile exactly.

## Sensitive Data

- **Never commit secrets** — use environment variables and `.env.local` (gitignored).
- **Never expose server secrets to the client** — in Vite, only `VITE_*` vars are client-visible.
- **Never log sensitive data** — PII, tokens, passwords should never appear in console.log or error tracking.
- **Mask sensitive fields** in error reporting (Sentry, LogRocket):

```typescript
Sentry.init({
    beforeSend(event) {
        if (event.request?.headers) {
            delete event.request.headers["Authorization"];
            delete event.request.headers["Cookie"];
        }
        return event;
    },
});
```

## Third-Party Scripts

- Load third-party scripts with `async` or `defer`.
- Use Subresource Integrity (SRI) for CDN-hosted scripts:

```html
<script src="https://cdn.example.com/lib.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>
```

- Sandbox third-party content in iframes with restrictive `sandbox` attributes.
- Audit third-party scripts regularly — they run with full page access.

## Checklist

- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] CSP header configured (at minimum `default-src 'self'`)
- [ ] Auth tokens in `HttpOnly` cookies, not `localStorage`
- [ ] SameSite cookies for CSRF protection
- [ ] Input validated on both client and server
- [ ] Security headers set (HSTS, X-Content-Type-Options, X-Frame-Options)
- [ ] Dependencies audited regularly
- [ ] No secrets in client-visible code or environment variables
- [ ] Third-party scripts use SRI
