/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { register } from "./test.js";
import { api, internal } from "./_generated/api.js";

const modules = import.meta.glob("./**/*.ts");

describe("treg component", () => {
  test("registers component and executes recordReceipt and getCalls", async () => {
    const t = convexTest(schema, modules);
    register(t, "treg");

    // recordReceipt internal mutation returns null
    const receiptResult = await t.mutation(internal.treg.recordReceipt, {
      callId: "call_abc123",
      ownerHash: "testhash12345678",
      endpoint: "spyfu.google.domain.competitors",
      costMicro: 200,
      servedVia: "primary",
      at: Date.now(),
    });
    expect(receiptResult).toBeNull();

    // getCalls query retrieves the recorded receipt
    const calls = await t.query(api.treg.getCalls, {
      ownerHash: "testhash12345678",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].callId).toBe("call_abc123");
    expect(calls[0].endpoint).toBe("spyfu.google.domain.competitors");
    expect(calls[0].costMicro).toBe(200);
  });

  test("client getCalls queries using hashed owner", async () => {
    const { Treg, hashOwner } = await import("./client.js");
    const t = convexTest(schema, modules);
    register(t, "treg");

    const owner = "user_456";
    const expectedHash = await hashOwner(owner);

    await t.mutation(internal.treg.recordReceipt, {
      callId: "call_client_test",
      ownerHash: expectedHash,
      endpoint: "spyfu.google.domain.competitors",
      costMicro: 150,
      at: Date.now(),
    });

    const client = new Treg({ treg: api.treg });
    const calls = await t.run(async (ctx) => {
      return await client.getCalls(ctx, { owner });
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].callId).toBe("call_client_test");
    expect(calls[0].ownerHash).toBe(expectedHash);
  });
});
