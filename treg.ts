import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { action, internalMutation, query, env } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { buildCallUrl, callFailureReason, TREG_DEFAULT_BASE_URL } from "./lib/treg.js";

/**
 * Call any catalogued treg endpoint by id. Auth lives in the app: the
 * caller passes its already-verified owner string (components have no
 * ctx.auth), which is hashed before it leaves as the ledger tag. The token
 * and base URL come only from the component's declared env, never from
 * arguments; every call carries a spend ceiling (X-Treg-Route-Max-Cost
 * refuses instead of overspending) and a fresh idempotency key so a retry
 * is never billed twice. The upstream answer relays verbatim.
 */
export const call = action({
  args: {
    owner: v.string(),
    endpoint: v.string(),
    params: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
    maxCostUsd: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<unknown> => {
    const token = env.TREG_TOKEN;
    if (!token) throw new ConvexError("Treg is not switched on yet.");
    const baseUrl = env.TREG_BASE_URL ?? TREG_DEFAULT_BASE_URL;
    const url = buildCallUrl(baseUrl, { endpoint: args.endpoint, params: args.params });
    const ownerHash = await sha256Hex(args.owner);
    const res = await fetch(url, {
      headers: {
        "X-Treg-Token": token,
        "X-Treg-Route-Max-Cost": String(args.maxCostUsd ?? 0.05),
        "Idempotency-Key": crypto.randomUUID(),
        "X-Treg-Meta": `customer=${ownerHash}`,
      },
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) throw new ConvexError(callFailureReason(res.status));
    const json = (await res.json()) as unknown;

    // Record spend receipt in internal calls table if headers are present
    const callId = res.headers.get("x-treg-call-id");
    const costMicroStr = res.headers.get("x-treg-cost-micro");
    const servedVia = res.headers.get("x-treg-served-via") ?? undefined;
    if (callId && costMicroStr) {
      const costMicro = parseInt(costMicroStr, 10);
      if (!Number.isNaN(costMicro)) {
        await ctx.runMutation(internal.treg.recordReceipt, {
          callId,
          ownerHash,
          endpoint: args.endpoint,
          costMicro,
          servedVia,
          at: Date.now(),
        });
      }
    }

    return json;
  },
});

/**
 * Record a spend receipt into the calls table.
 */
export const recordReceipt = internalMutation({
  args: {
    callId: v.string(),
    ownerHash: v.string(),
    endpoint: v.string(),
    costMicro: v.number(),
    servedVia: v.optional(v.string()),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("calls", args);
  },
});

/**
 * Read spend receipts for a specific owner hash.
 */
export const getCalls = query({
  args: {
    ownerHash: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("calls"),
      _creationTime: v.number(),
      callId: v.string(),
      ownerHash: v.string(),
      endpoint: v.string(),
      costMicro: v.number(),
      servedVia: v.optional(v.string()),
      at: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("calls")
      .withIndex("by_owner", (q) => q.eq("ownerHash", args.ownerHash))
      .order("desc")
      .take(limit);
  },
});

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
