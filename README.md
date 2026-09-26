<p align="center">
  <img src="./banner.png" alt="Treg - OpenRouter for Developer Tools Banner" width="100%" />
</p>

# @listeningkit/treg (Convex Treg Component)

> A production-ready [Convex Component](https://docs.convex.dev/components) adapting [treg](https://github.com/superdesigndev/treg) — the open-source **"OpenRouter for developer tools."**

[![Convex Component](https://img.shields.io/badge/Convex-Component-blue)](https://docs.convex.dev/components)
[![npm version](https://img.shields.io/npm/v/@listeningkit/treg.svg)](https://www.npmjs.com/package/@listeningkit/treg)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![treg.to Free $1](https://img.shields.io/badge/Get%20Free%20$1%20Credit-treg.to-purple)](https://treg.to/?ref=matthewdonse-aebsh)

| | |
|---|---|
| **Upstream engine** | [superdesigndev/treg](https://github.com/superdesigndev/treg) (Apache-2.0) |
| **Hosted registry** | [treg.to](https://treg.to/?ref=matthewdonse-aebsh) — 3,000+ catalogued endpoints across 60+ providers |
| **CLI** | `treg` — `curl -fsSL https://treg.to/install.sh \| sh` |
| **Community** | [Discord](https://discord.gg/6mQYYfFMAn) |
| **Component** | `@listeningkit/treg` on [npm](https://www.npmjs.com/package/@listeningkit/treg) |
| **License** | Apache-2.0 (with additional terms upstream — no competing hosted registry; pass-through use of the treg.to API is fine) |

---

> [!TIP]
> ### 🎁 Get $1.00 of Free Credits on Signup!
> When you create your account at **[treg.to/?ref=matthewdonse-aebsh](https://treg.to/?ref=matthewdonse-aebsh)**, you automatically receive **$1.00 in free tool execution balance**.
> Because catalog calls start at just ~$0.0002 per call (e.g. SpyFu, SERP, and SEO data), **$1.00 gives you up to 5,000 free API calls** with zero credit card required upfront!
> 👉 **[Claim your free $1 credit on treg.to here](https://treg.to/?ref=matthewdonse-aebsh)**

---

## Overview

[`superdesigndev/treg`](https://github.com/superdesigndev/treg) is an open-source tool execution proxy and registry designed as the *OpenRouter for developer tools*. It enables developers and AI agents to route, run, and pay for 3,000+ catalogued endpoints across 60+ external providers (including SpyFu, Firecrawl, SE Ranking, SerpApi, Perplexity, GitHub, Stripe, Resend, and more) through a single unified API, unified billing, and self-hosted proxy with BYOK, OAuth token refreshing, and per-call spend guardrails.

This package (`@listeningkit/treg`) provides the native, fully sandboxed **Convex Component** extension for [treg.to](https://treg.to/?ref=matthewdonse-aebsh). It allows any Convex backend to execute tools directly from Convex actions with zero client credentials on device, automatic spend ceilings, fresh idempotency keys, privacy-preserving attribution, and an isolated audit ledger.

---

## Convex Component Architecture

This package is authored according to the [Convex Component Specification](https://docs.convex.dev/components/authoring):

```
treg/
├── banner.png             # Visual component header banner
├── convex.config.ts       # Component definition & typed environment variables
├── schema.ts              # Encapsulated database schema (spend receipts ledger)
├── treg.ts                # Component actions, mutations, and queries
├── client.ts              # Type-safe client wrapper for host applications
├── lib/
│   └── treg.ts            # Pure helper utilities (URL builder, error parser)
├── dist/                  # Compiled JavaScript and TypeScript declarations
└── package.json           # Component exports, peerDependencies, and scripts
```

### 1. Sandboxed Database Isolation
Components in Convex run inside an isolated boundary. The component defines its own `schema.ts` with a `calls` table. Spend receipts logged by the component remain strictly encapsulated within the component's internal database partition and never conflict with or pollute the host application's data model.

### 2. Typed Environment Injection
The component declares its required environment variables in [`convex.config.ts`](./convex.config.ts):
- `TREG_TOKEN` — Your team bearer token from **[treg.to/?ref=matthewdonse-aebsh](https://treg.to/?ref=matthewdonse-aebsh)** (sign up to get your free $1 credit!).
- `TREG_BASE_URL` — Optional base URL (defaults to `https://treg.to`).

Because these are bound in the component configuration, host action callers never need to pass API secrets as function arguments.

### 3. Ergonomic Client Wrapper Pattern
Directly invoking component functions via `ctx.runAction(components.treg.treg.call, ...)` requires tedious and fragile type assertions. This package exports a first-class `Treg` client wrapper class from the package root:
```ts
import { Treg } from "@listeningkit/treg";
import { components } from "./_generated/api";

export const treg = new Treg(components.treg);
```
The wrapper provides strongly typed methods, auto-hashing of owner identifiers, and transparent context forwarding.

---

## Installation & Setup

### 1. Install the Package

Install `@listeningkit/treg` in your Convex application:

```bash
# npm
npm install @listeningkit/treg

# pnpm
pnpm add @listeningkit/treg

# yarn
yarn add @listeningkit/treg
```

*(Ensure `convex` version `>=1.45.0` is installed as a peer dependency).*

### 2. Register the Component

Register the component inside your host application's `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import treg from "@listeningkit/treg/convex.config";

const app = defineApp();
app.use(treg);

export default app;
```

### 3. Configure Deployment Environment Variables

Get your team token with free $1 credits from **[treg.to/?ref=matthewdonse-aebsh](https://treg.to/?ref=matthewdonse-aebsh)**, then set it on your Convex deployment:

```bash
npx convex env set TREG_TOKEN="your-treg-team-token"

# Optional: if using a self-hosted treg instance
npx convex env set TREG_BASE_URL="https://treg.your-domain.com"
```

*(Note: Environment variables are optional at install/codegen time so they never block local builds or type checking).*

### 4. Regenerate Types

Run Convex codegen to generate component bindings:

```bash
npx convex dev --once
```

---

## How to Use in Production

### In Host Convex Actions

Wrap tool calls in your host application (e.g. `convex/tools.ts`) to authenticate your users, apply business logic, and forward calls to the component:

```ts
import { v } from "convex/values";
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { Treg } from "@listeningkit/treg";

// Instantiate the component client
const treg = new Treg(components.treg);

export const searchDomainCompetitors = action({
  args: {
    domain: v.string(),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate caller in your host app
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 2. Call any tool catalogued on treg.to
    const result = await treg.call(ctx, {
      owner: identity.subject, // Automatically hashed server-side into customer attribution
      endpoint: "spyfu.google.domain.competitors",
      params: {
        domain: args.domain,
        pageSize: args.pageSize ?? 5,
      },
      maxCostUsd: 0.05, // Spend ceiling: treg rejects upfront if cost exceeds this reserve
    });

    return result;
  },
});
```

### Reading Spend Receipts & Audit Trail

Every successful tool invocation records a receipt in the component's internal `calls` table using the response headers (`X-Treg-Call-Id`, `X-Treg-Cost-Micro`, and `X-Treg-Served-Via`).

To query the logged receipts from your host application:

```ts
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import { Treg } from "@listeningkit/treg";

const treg = new Treg(components.treg);

export const getMyToolUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Returns recent receipts for this user
    return await treg.getCalls(ctx, {
      owner: identity.subject,
      limit: 20,
    });
  },
});
```

---

## Production Guardrails

| Guardrail | Mechanism | Benefit |
|---|---|---|
| **Max Cost Ceiling** | `X-Treg-Route-Max-Cost` header | Treg refuses the call upfront (HTTP 402) if reserve exceeds max cost; zero funds charged. |
| **Idempotency Guarantee** | Fresh `crypto.randomUUID()` header per call | Upstream retries or network replays are never double-billed. |
| **Privacy Attribution** | SHA-256 hashed owner (`customer=<hash>`) | Per-tenant spend ledger and multi-tenant scoping without leaking raw user IDs or PII upstream. |
| **Audit Ledger** | Isolated `calls` table in component schema | Automatically stores `callId`, `ownerHash`, `endpoint`, `costMicro`, `servedVia`, and `at`. |
| **Fail-Safe Timeout** | `AbortSignal.timeout(55_000)` | Prevents hung actions from consuming backend execution budget. |

---

## Catalog, Costs & Failover Strategy

Sign up at **[treg.to/?ref=matthewdonse-aebsh](https://treg.to/?ref=matthewdonse-aebsh)** to get **$1.00 free credit**, which covers thousands of calls across 3,000+ catalogued endpoints on 60+ providers.

Search the full catalog at **[treg.to/catalog](https://treg.to/?ref=matthewdonse-aebsh)** or via the unauthenticated search API:

```bash
curl "https://treg.to/catalog/search?q=competitors"
```

### Failover Pattern Example (SEO Competitors)

When building resilient AI workflows, implement failover between provider rows:

| Provider | Endpoint ID | Approx. Cost | Free Calls from $1 Credit | Role |
|---|---|---|---|---|
| **SpyFu** | `spyfu.google.domain.competitors` | ~$0.0002 / row | **~5,000 calls** | Primary (fast, keyword-overlap ranking) |
| **SE Ranking** | `seranking.google.domain.competitors` | ~$0.0179 / call | **~55 calls** | Failover (rich metrics: domain relevance, traffic) |
| **SerpApi** | `serpstat.google.domain.competitors` | ~$0.0005 / result | **~2,000 calls** | Alternate |

> **Failover Policy**: On HTTP `429` (rate limit), `503` (provider temporarily down), or timeout, retry with the next catalog provider row. Never failover on `4xx` client errors (invalid domain/parameters will fail across all providers and waste credit).

---

## Component Development & Publishing

### Build from Source

```bash
# Install dependencies
pnpm install

# Compile TypeScript declarations and JavaScript bundles
pnpm run build

# Type check
pnpm run typecheck

# Run tests
pnpm test
```

### Publishing to NPM

1. Ensure clean build and type generation:
   ```bash
   pnpm run build:clean
   ```
2. Publish to npm:
   ```bash
   npm publish --access public
   ```
3. Submit to the official [Convex Components Directory](https://www.convex.dev/components).

---

## Free Signup Link

Don't forget to grab your **$1.00 free tool credit** when getting started:
👉 **[Sign up on treg.to (?ref=matthewdonse-aebsh)](https://treg.to/?ref=matthewdonse-aebsh)**

## License

Apache 2.0. See [superdesigndev/treg](https://github.com/superdesigndev/treg) for upstream engine details (including its additional terms: use freely, even commercially; pass-through use of the treg.to API is allowed; don't redistribute the code as a competing hosted registry without written permission).
