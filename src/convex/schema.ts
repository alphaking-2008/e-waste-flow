import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Collection request lifecycle: Pending → Approved → Collected → Recycled (or Rejected)
export const STATUSES = [
  "Pending",
  "Approved",
  "Collected",
  "Recycled",
  "Rejected",
] as const;
export const statusValidator = v.union(
  ...STATUSES.map((s) => v.literal(s)),
);
export type EwasteStatus = (typeof STATUSES)[number];

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // --- DMS project fields (relational columns of the Users table) ---
      phone: v.optional(v.string()), // Mobile number
      address: v.optional(v.string()), // Address
      userId: v.optional(v.string()), // readable foreign key label e.g. U-1001
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ============ E-Waste DMS tables ============
    // Lookup table (referenced by eWaste.categoryId — FK relationship)
    categories: defineTable({
      name: v.string(), // Mobile Phones, Computers/Laptops, ...
    }).index("by_name", ["name"]),

    // E_Waste table. FKs: userId → users, categoryId → categories
    eWaste: defineTable({
      code: v.string(), // readable primary key label e.g. EW-0001
      userId: v.id("users"), // FK → users.User_ID
      categoryId: v.id("categories"), // FK → categories.Category_ID
      itemName: v.string(),
      quantity: v.number(),
      condition: v.string(), // Working / Repairable / Damaged / Non-Functional
      weightKg: v.number(), // approximate weight in kg
      collectionAddress: v.string(),
      preferredDate: v.string(), // ISO date string yyyy-mm-dd
      description: v.string(),
      status: statusValidator, // denormalized lifecycle status mirrored from collection
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_code", ["code"])
      .index("by_status", ["status"])
      .index("by_category", ["categoryId"]),

    // Collection table. FK: eWasteId → eWaste.EWaste_ID (1:1 with E_Waste row)
    collection: defineTable({
      eWasteId: v.id("eWaste"), // FK → eWaste.EWaste_ID
      collectionDate: v.string(), // ISO date string
      address: v.string(),
      status: statusValidator,
      createdAt: v.number(),
    }).index("by_ewaste", ["eWasteId"]).index("by_status", ["status"]),

    // Recycling table. FK: eWasteId → eWaste.EWaste_ID (created once item is recycled)
    recycling: defineTable({
      eWasteId: v.id("eWaste"), // FK → eWaste.EWaste_ID
      recyclingDate: v.string(), // ISO date string
      method: v.string(), // Recycling_Method: Material Recovery, Refurbishing, ...
      recycledWeightKg: v.number(),
    }).index("by_ewaste", ["eWasteId"]),

    // Contact page messages (Customer table)
    messages: defineTable({
      name: v.string(),
      email: v.string(),
      body: v.string(),
      createdAt: v.number(),
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
