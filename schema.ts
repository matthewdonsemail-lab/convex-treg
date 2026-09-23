import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Spend receipts, one row per catalog call. Cost comes only from the
  // X-Treg-Cost-Micro / X-Treg-Call-Id response headers, never from a
  // provider body. Owner is a SHA-256 hash, never the raw identifier.
  calls: defineTable({
    callId: v.string(),
    ownerHash: v.string(),
    endpoint: v.string(),
    costMicro: v.number(),
    servedVia: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_owner", ["ownerHash"])
    .index("by_call", ["callId"]),
});
