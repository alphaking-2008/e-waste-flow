import { createAccount } from "@convex-dev/auth/server";
import { internalMutation } from "./_generated/server";

/**
 * One-time fixup: the first seed ran before login accounts were created for
 * the demo users. This adds password accounts for the existing users rows.
 */
export const backfillAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let created = 0;
    for (const user of users) {
      if (!user.email || user.email.endsWith("@student.edu") === false) continue;
      try {
        await createAccount(ctx as any, {
          provider: "password",
          account: { id: user.email, secret: "ewaste123" },
          profile: { email: user.email, name: user.name ?? "" },
        });
        created++;
      } catch {
        // Account already exists — fine.
      }
    }
    return `Created ${created} auth accounts for demo users.`;
  },
});
