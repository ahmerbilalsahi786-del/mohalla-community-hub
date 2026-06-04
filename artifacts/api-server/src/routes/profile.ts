import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable, postsTable, listingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const ser = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
};

async function getOrCreateProfile(userId: string, displayName?: string, unitNumber?: string) {
  const existing = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(userProfilesTable)
    .values({ userId, displayName: displayName || userId, unitNumber: unitNumber || "" })
    .returning();
  return created;
}

// GET /api/profile/:userId
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await getOrCreateProfile(userId);

    const [posts, listings] = await Promise.all([
      db.select().from(postsTable).where(eq(postsTable.userId, userId)).orderBy(desc(postsTable.createdAt)).limit(20),
      db.select().from(listingsTable).where(eq(listingsTable.userId, userId)).orderBy(desc(listingsTable.createdAt)).limit(20),
    ]);

    res.json({
      profile: ser(profile as unknown as Record<string, unknown>),
      posts: posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), imageUrls: p.imageUrls ?? [] })),
      listings: listings.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// PUT /api/profile/:userId — must be self
router.put("/profile/:userId", requireAuth, async (req, res) => {
  if (req.params.userId !== req.user!.userId) {
    void res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const { userId } = req.params;
    const { displayName, unitNumber, avatarUrl, whatsappNumber } = req.body;

    const existing = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    let profile;
    if (existing[0]) {
      const updates: Partial<typeof userProfilesTable.$inferInsert> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (unitNumber  !== undefined) updates.unitNumber  = unitNumber;
      if (avatarUrl   !== undefined) updates.avatarUrl   = avatarUrl;
      if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;

      [profile] = await db
        .update(userProfilesTable)
        .set(updates)
        .where(eq(userProfilesTable.userId, userId))
        .returning();
    } else {
      [profile] = await db
        .insert(userProfilesTable)
        .values({ userId, displayName: displayName || userId, unitNumber: unitNumber || "", avatarUrl, whatsappNumber })
        .returning();
    }

    res.json(ser(profile as unknown as Record<string, unknown>));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// GET /api/settings/notifications — current user only
router.get("/settings/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await getOrCreateProfile(userId);
    res.json({
      notifyComments:      profile.notifyComments,
      notifyLikes:         profile.notifyLikes,
      notifySafety:        profile.notifySafety,
      notifyAnnouncements: profile.notifyAnnouncements,
      notifyMarketplace:   profile.notifyMarketplace,
      notifyApprovals:     profile.notifyApprovals,
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// PUT /api/settings/notifications — current user only
router.put("/settings/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { notifyComments, notifyLikes, notifySafety, notifyAnnouncements, notifyMarketplace, notifyApprovals } = req.body;

    const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    const updates: Partial<typeof userProfilesTable.$inferInsert> = {};
    if (notifyComments      !== undefined) updates.notifyComments      = notifyComments;
    if (notifyLikes         !== undefined) updates.notifyLikes         = notifyLikes;
    if (notifySafety        !== undefined) updates.notifySafety        = notifySafety;
    if (notifyAnnouncements !== undefined) updates.notifyAnnouncements = notifyAnnouncements;
    if (notifyMarketplace   !== undefined) updates.notifyMarketplace   = notifyMarketplace;
    if (notifyApprovals     !== undefined) updates.notifyApprovals     = notifyApprovals;

    let profile;
    if (existing[0]) {
      [profile] = await db.update(userProfilesTable).set(updates).where(eq(userProfilesTable.userId, userId)).returning();
    } else {
      [profile] = await db.insert(userProfilesTable).values({ userId, displayName: userId, ...updates }).returning();
    }

    res.json(ser(profile as unknown as Record<string, unknown>));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
