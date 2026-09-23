import type { GenericActionCtx, GenericQueryCtx, FunctionReference } from "convex/server";
import { buildCallUrl, callFailureReason, TREG_DEFAULT_BASE_URL, type CatalogCall } from "./lib/treg.js";

/**
 * Interface representing the internal API exposed by the Treg Convex component.
 */
export type TregComponentApi = {
  treg: {
    call: FunctionReference<
      "action",
      "internal",
      {
        owner: string;
        endpoint: string;
        params?: Record<string, string | number | boolean>;
        maxCostUsd?: number;
      },
      any
    >;
    getCalls: FunctionReference<
      "query",
      "internal",
      {
        ownerHash: string;
        limit?: number;
      },
      Array<{
        _id: string;
        _creationTime: number;
        callId: string;
        ownerHash: string;
        endpoint: string;
        costMicro: number;
        servedVia?: string;
        at: number;
      }>
    >;
  };
};

export interface TregCallArgs {
  /**
   * The owner identifier from your host application (e.g. user id, team id).
   * Automatically hashed into a privacy-preserving attribution tag before leaving your backend.
   */
  owner: string;
  /**
   * Catalog endpoint identifier on treg.to (e.g. "spyfu.google.domain.competitors").
   */
  endpoint: string;
  /**
   * Flat key-value parameters passed to the catalog endpoint query string.
   */
  params?: Record<string, string | number | boolean>;
  /**
   * Optional spend ceiling for this call in USD (defaults to $0.05).
   * Treg refuses the call upfront (HTTP 402, charged nothing) if estimated cost exceeds this limit.
   */
  maxCostUsd?: number;
}

export interface TregCallRecord {
  _id: string;
  _creationTime: number;
  callId: string;
  ownerHash: string;
  endpoint: string;
  costMicro: number;
  servedVia?: string;
  at: number;
}

/**
 * Computes a 16-character SHA-256 hex hash for customer attribution tags.
 */
export async function hashOwner(owner: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(owner));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/**
 * Client wrapper for the Treg Convex component.
 *
 * Provides a type-safe, ergonomic API for invoking tools in the treg.to catalog
 * and reading spent call receipts.
 *
 * @example
 * ```ts
 * import { Treg } from "@superdesign/convex-treg";
 * import { components } from "./_generated/api";
 *
 * export const treg = new Treg(components.treg);
 *
 * // Inside a Convex action:
 * export const findCompetitors = action({
 *   args: { domain: v.string() },
 *   handler: async (ctx, args) => {
 *     const user = await auth.getUser(ctx);
 *     return await treg.call(ctx, {
 *       owner: user._id,
 *       endpoint: "spyfu.google.domain.competitors",
 *       params: { domain: args.domain, pageSize: 5 },
 *       maxCostUsd: 0.05,
 *     });
 *   },
 * });
 * ```
 */
export class Treg {
  constructor(public readonly component: TregComponentApi | any) {}

  /**
   * Proxies a tool call to https://treg.to with automatic spend guardrails,
   * fresh idempotency key, and hashed customer attribution.
   */
  async call<T = unknown>(
    ctx: { runAction: GenericActionCtx<any>["runAction"] },
    args: TregCallArgs,
  ): Promise<T> {
    return (await ctx.runAction(this.component.treg.call, args)) as T;
  }

  /**
   * Retrieves logged spend receipts for a specific owner from the component's internal database.
   */
  async getCalls(
    ctx: { runQuery: GenericQueryCtx<any>["runQuery"] },
    args: { owner: string; limit?: number },
  ): Promise<TregCallRecord[]> {
    const ownerHash = await hashOwner(args.owner);
    return (await ctx.runQuery(this.component.treg.getCalls, {
      ownerHash,
      limit: args.limit,
    })) as TregCallRecord[];
  }
}

export { buildCallUrl, callFailureReason, TREG_DEFAULT_BASE_URL, type CatalogCall };
