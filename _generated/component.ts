/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    treg: {
      call: FunctionReference<
        "action",
        "internal",
        {
          endpoint: string;
          maxCostUsd?: number;
          owner: string;
          params?: Record<string, string | number | boolean>;
        },
        any,
        Name
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
        }>,
        Name
      >;
    };
  };
