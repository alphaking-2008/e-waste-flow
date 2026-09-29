import { createAccount } from "@convex-dev/auth/server";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time sample data loader (INSERT statements) so every table has
 * realistic records for the college demo. Idempotent: skips if data exists.
 * Run once with: bun convex run seed:loadSampleData
 */

export const loadSampleData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return "Data already present — skipped.";

    // ---------- categories lookup table ----------
    const categoryNames = [
      "Mobile Phones",
      "Computers/Laptops",
      "TVs/Monitors",
      "Batteries",
      "Printers",
      "Cables",
      "Other Electronics",
    ];
    const categoryIds: Record<string, any> = {};
    for (const name of categoryNames) {
      categoryIds[name] = await ctx.db.insert("categories", { name });
    }

    // ---------- users (password: ewaste123 for all demo accounts) ----------
    const demoUsers = [
      { name: "Aarav Sharma", email: "aarav@student.edu", phone: "+91 98200 11001", address: "12 Rose Villa, MG Road, Pune 411001" },
      { name: "Diya Patel", email: "diya@student.edu", phone: "+91 98200 11002", address: "45 Lakeview Apartments, Andheri West, Mumbai 400058" },
      { name: "Rohan Mehta", email: "rohan@student.edu", phone: "+91 98200 11003", address: "7B Green Park, Sector 15, Noida 201301" },
      { name: "Ishita Rao", email: "ishita@student.edu", phone: "+91 98200 11004", address: "230 Palm Street, Indiranagar, Bengaluru 560038" },
      { name: "Kabir Nair", email: "kabir@student.edu", phone: "+91 98200 11005", address: "18 Sunrise Enclave, Banjara Hills, Hyderabad 500034" },
    ];
    const userIds: any[] = [];
    for (let i = 0; i < demoUsers.length; i++) {
      const u = demoUsers[i];
      const id = await ctx.db.insert("users", {
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: "user",
        userId: `U-${1001 + i}`,
      });
      userIds.push(id);
      // Create the auth account so demo users can actually log in
      // (password hashing is handled by the auth package).
      await createAccount(ctx as any, {
        provider: "password",
        account: { id: u.email, secret: "ewaste123" },
        profile: { email: u.email, name: u.name },
      });
    }

    // ---------- e_waste + collection (+ recycling for finished ones) ----------
    type Seed = {
      user: number;
      category: string;
      item: string;
      qty: number;
      condition: string;
      weight: number;
      status: "Pending" | "Approved" | "Collected" | "Recycled" | "Rejected";
      ageDays: number;
      desc: string;
    };
    const seeds: Seed[] = [
      { user: 0, category: "Mobile Phones", item: "Smartphone (cracked screen)", qty: 2, condition: "Damaged", weight: 0.4, status: "Recycled", ageDays: 74, desc: "Old handsets with broken displays, batteries intact." },
      { user: 1, category: "Computers/Laptops", item: "Laptop i5 6th Gen", qty: 1, condition: "Repairable", weight: 2.2, status: "Recycled", ageDays: 68, desc: "Boots but battery dead; screen fine." },
      { user: 2, category: "TVs/Monitors", item: 'LED Monitor 22"', qty: 3, condition: "Working", weight: 3.1, status: "Recycled", ageDays: 61, desc: "Lab upgrade leftovers, fully working." },
      { user: 3, category: "Batteries", item: "Laptop battery pack", qty: 5, condition: "Non-Functional", weight: 0.3, status: "Recycled", ageDays: 55, desc: "Swollen Li-ion packs, needs safe disposal." },
      { user: 4, category: "Printers", item: "Inkjet printer", qty: 1, condition: "Repairable", weight: 4.5, status: "Collected", ageDays: 47, desc: "Paper feed jammed; otherwise fine." },
      { user: 0, category: "Cables", item: "Mixed cable bundle", qty: 12, condition: "Working", weight: 0.1, status: "Collected", ageDays: 40, desc: "USB, HDMI and power cables collected from hostel." },
      { user: 1, category: "Mobile Phones", item: "Feature phone", qty: 4, condition: "Working", weight: 0.2, status: "Recycled", ageDays: 34, desc: "Working button phones donated after data wipe." },
      { user: 2, category: "Computers/Laptops", item: "Desktop keyboard + mouse", qty: 6, condition: "Working", weight: 0.6, status: "Approved", ageDays: 27, desc: "Spare peripherals from computer lab." },
      { user: 3, category: "TVs/Monitors", item: 'CRT Monitor 17"', qty: 2, condition: "Non-Functional", weight: 14.0, status: "Approved", ageDays: 21, desc: "Heavy CRTs, do not power on." },
      { user: 4, category: "Other Electronics", item: "Wi-Fi router", qty: 3, condition: "Repairable", weight: 0.5, status: "Pending", ageDays: 14, desc: "Overheating routers replaced by ISP." },
      { user: 0, category: "Printers", item: "Laser printer toner unit", qty: 2, condition: "Damaged", weight: 1.8, status: "Pending", ageDays: 9, desc: "Leaking toner cartridges, handle with care." },
      { user: 1, category: "Batteries", item: "AA/AAA alkaline lot", qty: 40, condition: "Non-Functional", weight: 0.02, status: "Rejected", ageDays: 30, desc: "Household batteries — referred to municipal drop-off." },
    ];

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const created = Date.now() - s.ageDays * 24 * 60 * 60 * 1000;
      const code = `EW-${String(i + 1).padStart(4, "0")}`;
      const preferredDate = new Date(created + 5 * 86400000)
        .toISOString()
        .slice(0, 10);

      const eWasteId = await ctx.db.insert("eWaste", {
        code,
        userId: userIds[s.user],
        categoryId: categoryIds[s.category],
        itemName: s.item,
        quantity: s.qty,
        condition: s.condition,
        weightKg: s.weight,
        collectionAddress: demoUsers[s.user].address,
        preferredDate,
        description: s.desc,
        status: s.status,
        createdAt: created,
      });

      if (s.status !== "Rejected") {
        await ctx.db.insert("collection", {
          eWasteId,
          collectionDate:
            s.status === "Recycled" || s.status === "Collected"
              ? new Date(created + 4 * 86400000).toISOString().slice(0, 10)
              : preferredDate,
          address: demoUsers[s.user].address,
          status: s.status,
          createdAt: created,
        });
      }

      if (s.status === "Recycled") {
        await ctx.db.insert("recycling", {
          eWasteId,
          recyclingDate: new Date(created + 12 * 86400000)
            .toISOString()
            .slice(0, 10),
          method: s.condition === "Working" ? "Refurbishing" : "Material Recovery",
          recycledWeightKg: Math.round(s.weight * s.qty * 0.85 * 10) / 10,
        });
      }
    }

    return `Seeded ${seeds.length} e-waste records, ${demoUsers.length} users, ${categoryNames.length} categories.`;
  },
});

/**
 * Second batch of sample data: 3 more students + 12 more records
 * (EW-0013 … EW-0024). Idempotent: skips if EW-0013 already exists.
 * Run with: bun convex run seed:loadSampleDataBatch2
 */
export const loadSampleDataBatch2 = internalMutation({
  args: {},
  handler: async (ctx) => {
    const marker = await ctx.db
      .query("eWaste")
      .withIndex("by_code", (q) => q.eq("code", "EW-0013"))
      .first();
    if (marker) return "Batch 2 already present — skipped.";

    // ---------- new users (password: ewaste123) ----------
    const newUsers = [
      { name: "Meera Joshi", email: "meera@student.edu", phone: "+91 98200 11006", address: "9 Lakeview Residency, Civil Lines, Nagpur 440001" },
      { name: "Arjun Verma", email: "arjun@student.edu", phone: "+91 98200 11007", address: "62 Maple Heights, Sector 9, Chandigarh 160009" },
      { name: "Sneha Kulkarni", email: "sneha@student.edu", phone: "+91 98200 11008", address: "31 Palm Grove, Alwarpet, Chennai 600018" },
    ];
    const newUserIds: any[] = [];
    for (let i = 0; i < newUsers.length; i++) {
      const u = newUsers[i];
      const id = await ctx.db.insert("users", {
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: "user",
        userId: `U-${1006 + i}`,
      });
      newUserIds.push(id);
      await createAccount(ctx as any, {
        provider: "password",
        account: { id: u.email, secret: "ewaste123" },
        profile: { email: u.email, name: u.name },
      });
    }

    // ---------- e_waste rows EW-0013 … EW-0024 ----------
    const categoryRows = await ctx.db.query("categories").collect();
    const categoryIds: Record<string, any> = {};
    for (const row of categoryRows) categoryIds[row.name] = row._id;

    const allUserIds = (await ctx.db.query("users").collect())
      .filter((u) => u.email?.endsWith("@student.edu"))
      .sort((a, b) => (a.userId ?? "").localeCompare(b.userId ?? ""))
      .map((u) => u._id);

    type Seed2 = {
      user: number; // index into allUserIds (0-7)
      category: string;
      item: string;
      qty: number;
      condition: string;
      weight: number;
      status: "Pending" | "Approved" | "Collected" | "Recycled" | "Rejected";
      ageDays: number;
      desc: string;
    };
    const seeds: Seed2[] = [
      { user: 5, category: "Mobile Phones", item: "Tablet (10-inch, cracked)", qty: 1, condition: "Damaged", weight: 0.6, status: "Recycled", ageDays: 66, desc: "Screen shattered after a drop; battery intact." },
      { user: 6, category: "Computers/Laptops", item: "Chromebook 11", qty: 2, condition: "Repairable", weight: 1.4, status: "Recycled", ageDays: 58, desc: "Charging port loose on both units." },
      { user: 7, category: "TVs/Monitors", item: 'Projector (classroom)', qty: 1, condition: "Non-Functional", weight: 3.8, status: "Collected", ageDays: 52, desc: "Lamp burned out, main board faulty." },
      { user: 5, category: "Batteries", item: "Power bank 10000mAh", qty: 4, condition: "Non-Functional", weight: 0.25, status: "Recycled", ageDays: 44, desc: "Cells no longer hold charge." },
      { user: 6, category: "Printers", item: "Dot matrix printer", qty: 1, condition: "Repairable", weight: 6.0, status: "Collected", ageDays: 37, desc: "Ribbon mechanism works, rollers worn." },
      { user: 7, category: "Cables", item: "Ethernet cable coil", qty: 15, condition: "Working", weight: 0.15, status: "Recycled", ageDays: 31, desc: "Cat5e coils removed during rewiring." },
      { user: 0, category: "Other Electronics", item: "Digital camera + charger", qty: 1, condition: "Working", weight: 0.7, status: "Approved", ageDays: 24, desc: "Media lab surplus, fully functional." },
      { user: 1, category: "Mobile Phones", item: "Smartwatch (3 units)", qty: 3, condition: "Damaged", weight: 0.05, status: "Approved", ageDays: 18, desc: "Cracked glass, batteries swollen." },
      { user: 2, category: "Computers/Laptops", item: "External DVD writer", qty: 2, condition: "Working", weight: 0.4, status: "Pending", ageDays: 12, desc: "USB drives, clean and functional." },
      { user: 3, category: "Other Electronics", item: "E-reader", qty: 1, condition: "Repairable", weight: 0.2, status: "Pending", ageDays: 7, desc: "Screen ghosting issue." },
      { user: 4, category: "Cables", item: "Charger brick pile", qty: 9, condition: "Non-Functional", weight: 0.06, status: "Rejected", ageDays: 11, desc: "Uncertified chargers — unsafe to refurbish." },
      { user: 5, category: "TVs/Monitors", item: "Old projector screen", qty: 1, condition: "Damaged", weight: 2.5, status: "Rejected", ageDays: 5, desc: "Torn fabric, metal frame only." },
    ];

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const userRow = await ctx.db.get(allUserIds[s.user]);
      const created = Date.now() - s.ageDays * 24 * 60 * 60 * 1000;
      const code = `EW-${String(i + 13).padStart(4, "0")}`;
      const preferredDate = new Date(created + 5 * 86400000)
        .toISOString()
        .slice(0, 10);

      const eWasteId = await ctx.db.insert("eWaste", {
        code,
        userId: allUserIds[s.user],
        categoryId: categoryIds[s.category],
        itemName: s.item,
        quantity: s.qty,
        condition: s.condition,
        weightKg: s.weight,
        collectionAddress: userRow?.address ?? "Address on file",
        preferredDate,
        description: s.desc,
        status: s.status,
        createdAt: created,
      });

      if (s.status !== "Rejected") {
        await ctx.db.insert("collection", {
          eWasteId,
          collectionDate:
            s.status === "Recycled" || s.status === "Collected"
              ? new Date(created + 4 * 86400000).toISOString().slice(0, 10)
              : preferredDate,
          address: userRow?.address ?? "Address on file",
          status: s.status,
          createdAt: created,
        });
      }

      if (s.status === "Recycled") {
        await ctx.db.insert("recycling", {
          eWasteId,
          recyclingDate: new Date(created + 12 * 86400000).toISOString().slice(0, 10),
          method: s.condition === "Working" ? "Refurbishing" : "Material Recovery",
          recycledWeightKg: Math.round(s.weight * s.qty * 0.85 * 10) / 10,
        });
      }
    }

    return `Batch 2: seeded ${seeds.length} records, ${newUsers.length} users.`;
  },
});
