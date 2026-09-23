import { defineComponent } from "convex/server";
import { v } from "convex/values";

export default defineComponent("treg", {
  env: {
    // Optional so install never blocks codegen: the action throws
    // "not switched on yet" when no token is bound, same as FIRECRAWL_API_KEY.
    TREG_TOKEN: v.optional(v.string()),
    TREG_BASE_URL: v.optional(v.string()),
  },
});
