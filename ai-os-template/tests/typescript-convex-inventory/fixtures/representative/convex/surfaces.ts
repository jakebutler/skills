import { action, internalMutation, mutation, query } from "./_generated/server";

export const publicWrite = mutation({
  handler: async (ctx, args) => {
    await ctx.db.insert("attempts", { token: args.token });
    await ctx.db.patch(args.id, { status: "complete" });
  },
});

export const dispatchProvider = action({
  handler: async (ctx) => {
    await fetch("https://example.invalid/provider");
    await ctx.scheduler.runAfter(0, internal.cleanup, {});
    await ctx.runMutation(internal.jobs.finish, {});
  },
});

export const publicRead = query({
  handler: async (ctx) => await ctx.db.query("attempts").collect(),
});

crons.interval("retry outbox", { minutes: 5 }, internal.jobs.retry);

export const cleanup = internalMutation({
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.rowId);
  },
});

export const enqueueWebhook = internalMutation({
  handler: async (ctx) => {
    await ctx.db.insert("webhookOutbox", { status: "pending" });
  },
});

export const replayCacheEntry = internalMutation({
  handler: async (ctx) => {
    await ctx.db.insert("verificationCache", { status: "accepted" });
  },
});

export const reconcileCensus = internalMutation({
  handler: async (ctx) => {
    return await ctx.db.query("reports").paginate({ numItems: 100, cursor: null });
  },
});
