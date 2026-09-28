import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { STATUSES, statusValidator } from "./schema";
import { mutation, query } from "./_generated/server";

export const CONDITIONS = ["Working", "Repairable", "Damaged", "Non-Functional"];

/**
 * Returns the ID and name of every row in the `categories` lookup table.
 * Used to populate the registration form's category dropdown and filters.
 */
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("categories").collect();
    return rows
      .map((row) => ({ id: row._id, name: row.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Builds the next readable e-waste primary key (EW-0001, EW-0002, ...).
 * Demonstrates auto-generated primary keys before an INSERT.
 */
async function nextCode(db: any): Promise<string> {
  const rows = await db.query("eWaste").collect();
  let max = 0;
  for (const row of rows) {
    const match = /^EW-(\d+)$/.exec(row.code);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `EW-${String(max + 1).padStart(4, "0")}`;
}

/**
 * INSERT INTO e_waste + collection (one row each) inside a single transaction.
 * The collection row references the new e-waste row, modelling the
 * E_Waste 1:1 Collection foreign-key relationship.
 */
export const createRequest = mutation({
  args: {
    categoryId: v.id("categories"),
    itemName: v.string(),
    quantity: v.number(),
    condition: v.string(),
    weightKg: v.number(),
    collectionAddress: v.string(),
    preferredDate: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to register e-waste.");

    const code = await nextCode(ctx.db);
    const now = Date.now();

    const eWasteId = await ctx.db.insert("eWaste", {
      code,
      userId,
      categoryId: args.categoryId,
      itemName: args.itemName,
      quantity: args.quantity,
      condition: args.condition,
      weightKg: args.weightKg,
      collectionAddress: args.collectionAddress,
      preferredDate: args.preferredDate,
      description: args.description,
      status: "Pending",
      createdAt: now,
    });

    await ctx.db.insert("collection", {
      eWasteId,
      collectionDate: args.preferredDate,
      address: args.collectionAddress,
      status: "Pending",
      createdAt: now,
    });

    return { eWasteId, code };
  },
});

/** Shape returned by the join queries below. */
export type JoinedRequest = {
  id: any;
  code: string;
  itemName: string;
  quantity: number;
  condition: string;
  weightKg: number;
  categoryName: string;
  userName: string;
  userEmail: string;
  status: (typeof STATUSES)[number];
  requestDate: string; // yyyy-mm-dd derived from createdAt
  collectionDate: string;
  address: string;
  description: string;
  recycling: null | { date: string; method: string; weightKg: number };
};

/** Shared join logic: eWaste ⋈ categories ⋈ users ⋈ collection ⋈ recycling. */
async function hydrate(
  ctx: any,
  rows: { _id: any; [k: string]: any }[],
): Promise<JoinedRequest[]> {
  const out: JoinedRequest[] = [];
  for (const row of rows) {
    const [category, user, collectionRows, recyclingRows] = await Promise.all([
      ctx.db.get(row.categoryId),
      ctx.db.get(row.userId),
      ctx.db
        .query("collection")
        .withIndex("by_ewaste", (q: any) => q.eq("eWasteId", row._id))
        .collect(),
      ctx.db
        .query("recycling")
        .withIndex("by_ewaste", (q: any) => q.eq("eWasteId", row._id))
        .collect(),
    ]);
    const rec = recyclingRows[0];
    out.push({
      id: row._id,
      code: row.code,
      itemName: row.itemName,
      quantity: row.quantity,
      condition: row.condition,
      weightKg: row.weightKg,
      categoryName: category?.name ?? "—",
      userName: user?.name ?? "—",
      userEmail: user?.email ?? "",
      status: row.status,
      requestDate: new Date(row.createdAt).toISOString().slice(0, 10),
      collectionDate:
        collectionRows[0]?.collectionDate ?? row.preferredDate,
      address: row.collectionAddress,
      description: row.description,
      recycling: rec
        ? {
            date: rec.recyclingDate,
            method: rec.method,
            weightKg: rec.recycledWeightKg,
          }
        : null,
    });
  }
  return out;
}

/** SELECT all requests joined with their related tables (newest first). */
export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("eWaste").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return hydrate(ctx, rows);
  },
});

/** SELECT only the signed-in user's requests (WHERE User_ID = :current). */
export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("eWaste")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return hydrate(ctx, rows);
  },
});

export type Stats = {
  totalCollected: number;
  itemsRecycled: number;
  activeRequests: number;
  registeredUsers: number;
  totalWeightKg: number;
};

/** Aggregate statistics for the landing page and dashboards. */
export const globalStats = query({
  args: {},
  handler: async (ctx): Promise<Stats> => {
    const [eWasteRows, usersRows, collectionRows] = await Promise.all([
      ctx.db.query("eWaste").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("collection").collect(),
    ]);
    const realUsers = usersRows.filter((u) => !u.isAnonymous);
    const recycled = collectionRows.filter((c) => c.status === "Recycled");
    const active = collectionRows.filter(
      (c) => c.status === "Pending" || c.status === "Approved",
    );
    return {
      totalCollected: eWasteRows.length,
      itemsRecycled: recycled.length,
      activeRequests: active.length,
      registeredUsers: realUsers.length,
      totalWeightKg: eWasteRows.reduce(
        (sum, row) => sum + (row.weightKg ?? 0) * (row.quantity || 1),
        0,
      ),
    };
  },
});
