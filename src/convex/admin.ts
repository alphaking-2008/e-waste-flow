import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { statusValidator } from "./schema";
import { mutation } from "./_generated/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required.");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Admin access required.");
  return user;
}

/**
 * UPDATE collection.Status (and the mirrored eWaste.Status).
 * When a request reaches "Recycled", an INSERT into recycling is performed.
 */
export const updateStatus = mutation({
  args: { id: v.id("eWaste"), status: statusValidator },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    const now = new Date().toISOString().slice(0, 10);

    await ctx.db.patch(id, { status });

    const collectionRow = (
      await ctx.db
        .query("collection")
        .withIndex("by_ewaste", (q) => q.eq("eWasteId", id))
        .collect()
    )[0];
    if (collectionRow) {
      await ctx.db.patch(collectionRow._id, {
        status,
        collectionDate: status === "Pending" ? collectionRow.collectionDate : now,
      });
    }

    if (status === "Recycled") {
      const existing = (
        await ctx.db
          .query("recycling")
          .withIndex("by_ewaste", (q) => q.eq("eWasteId", id))
          .collect()
      )[0];
      if (!existing) {
        const row = await ctx.db.get(id);
        const weight = row?.weightKg ?? 0;
        await ctx.db.insert("recycling", {
          eWasteId: id,
          recyclingDate: now,
          method: "Material Recovery",
          recycledWeightKg: Math.round(weight * 0.85 * 10) / 10,
        });
      }
    }

    if (status === "Rejected") {
      const collectionId = collectionRow?._id;
      const recRow = (
        await ctx.db
          .query("recycling")
          .withIndex("by_ewaste", (q) => q.eq("eWasteId", id))
          .collect()
      )[0];
      if (recRow) await ctx.db.delete(recRow._id);
      if (collectionId) await ctx.db.delete(collectionId);
    }
  },
});

/** DELETE FROM e_waste with cascade to collection + recycling rows. */
export const deleteRequest = mutation({
  args: { id: v.id("eWaste") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const recRows = await ctx.db
      .query("recycling")
      .withIndex("by_ewaste", (q) => q.eq("eWasteId", id))
      .collect();
    for (const row of recRows) await ctx.db.delete(row._id);
    const colRows = await ctx.db
      .query("collection")
      .withIndex("by_ewaste", (q) => q.eq("eWasteId", id))
      .collect();
    for (const row of colRows) await ctx.db.delete(row._id);
    await ctx.db.delete(id);
  },
});
