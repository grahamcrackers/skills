# The Twelve-Factor App

A methodology for building modern, scalable, maintainable software-as-a-service apps. Full reference at [12factor.net](https://12factor.net/).

## I. Codebase — One codebase tracked in revision control, many deploys

One-to-one correlation between codebase and app. Multiple codebases means a distributed system, not one app. Shared code should be extracted into libraries managed via a dependency manager. There is one codebase but many deploys (production, staging, developer environments).

## II. Dependencies — Explicitly declare and isolate dependencies

Never rely on implicit system-wide packages. Declare all dependencies completely and exactly via a manifest (e.g., `package.json`, `requirements.txt`, `Gemfile`). Use dependency isolation to prevent implicit dependencies from leaking in. Declaration and isolation must always be used together.

## III. Config — Store config in the environment

Config is everything that varies between deploys: credentials, resource handles, per-deploy values. Strictly separate config from code. A litmus test: could the codebase be open-sourced right now without compromising any credentials? Store config in environment variables — they are language/OS-agnostic, granular, and hard to accidentally commit. Never group env vars into named "environments."

## IV. Backing Services — Treat backing services as attached resources

A backing service is any service consumed over the network: databases, message queues, SMTP, caches, third-party APIs. Make no distinction between local and third-party services in code. Both are attached resources accessed via URL or credentials stored in config. Swapping a local database for a managed one should require only a config change, never a code change.

## V. Build, Release, Run — Strictly separate build and run stages

Three stages transform code into a running deploy:

1. **Build** — convert repo into an executable bundle (fetch dependencies, compile assets)
2. **Release** — combine build with deploy-specific config; every release gets a unique ID
3. **Run** — launch processes against a release in the execution environment

Code cannot be changed at runtime. Releases are append-only and immutable. Keep the run stage to as few moving parts as possible.

## VI. Processes — Execute the app as one or more stateless processes

Processes are stateless and share-nothing. Any persistent data lives in a backing service. The filesystem and memory are single-transaction caches only — never assume cached data will be available on a future request. Sticky sessions violate twelve-factor; store session state in a time-expiring datastore like Redis or Memcached.

## VII. Port Binding — Export services via port binding

The app is completely self-contained. It exports HTTP (or other protocols) as a service by binding to a port and listening for requests. No runtime injection of a web server container is needed. A webserver library (e.g., Express, Koa, Fastify) is added as a dependency and runs in user space. One app can become a backing service for another by exposing its URL.

## VIII. Concurrency — Scale out via the process model

Processes are first-class citizens. Assign each type of work to a process type (e.g., web processes for HTTP, worker processes for background jobs). Individual processes can still use threads or async I/O internally, but the app must also be able to span multiple processes on multiple machines. The share-nothing model makes horizontal scaling a simple, reliable operation. Never daemonize or write PID files — rely on the OS process manager.

## IX. Disposability — Maximize robustness with fast startup and graceful shutdown

Processes can be started or stopped at a moment's notice. Minimize startup time (ideally a few seconds). On `SIGTERM`, shut down gracefully: stop accepting new requests, finish in-flight work, then exit. For workers, return the current job to the queue. Design for robustness against sudden death — use crash-only design principles and make operations idempotent or transactional.

## X. Dev/Prod Parity — Keep development, staging, and production as similar as possible

Minimize three gaps:

| Gap           | Traditional                       | Twelve-Factor          |
| ------------- | --------------------------------- | ---------------------- |
| **Time**      | Weeks between deploys             | Hours or minutes       |
| **Personnel** | Different people write and deploy | Same people            |
| **Tools**     | Divergent stacks                  | As similar as possible |

Resist using different backing services between environments (e.g., SQLite in dev, PostgreSQL in production). Tiny incompatibilities cause bugs that only surface in production. Use Docker, containers, or declarative provisioning to keep environments consistent.

## XI. Logs — Treat logs as event streams

The app never concerns itself with routing or storage of its output. Each process writes its event stream unbuffered to `stdout`. In development, the developer watches the stream in the terminal. In production, the execution environment captures, collates, and routes streams to archival/analysis destinations (Splunk, ELK, Datadog, etc.). The app has no knowledge of the final log destination.

## XII. Admin Processes — Run admin/management tasks as one-off processes

One-off tasks (database migrations, console sessions, cleanup scripts) run in an identical environment as the app's regular processes. They use the same release, codebase, config, and dependency isolation. Admin code ships with application code to avoid synchronization issues.

## Quick Reference

| #    | Factor              | One-Liner                             |
| ---- | ------------------- | ------------------------------------- |
| I    | Codebase            | One repo, many deploys                |
| II   | Dependencies        | Declare and isolate everything        |
| III  | Config              | Environment variables, not code       |
| IV   | Backing Services    | Attached resources via config         |
| V    | Build, Release, Run | Immutable, separated stages           |
| VI   | Processes           | Stateless and share-nothing           |
| VII  | Port Binding        | Self-contained, exports via port      |
| VIII | Concurrency         | Scale horizontally by process type    |
| IX   | Disposability       | Fast start, graceful stop             |
| X    | Dev/Prod Parity     | Same tools, same services everywhere  |
| XI   | Logs                | Stdout streams, not files             |
| XII  | Admin Processes     | One-off tasks in the same environment |
