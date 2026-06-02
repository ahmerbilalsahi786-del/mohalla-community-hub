import { Router } from "express";
import { db } from "@workspace/db";
import { membersTable, communitySettingsTable, postsTable, listingsTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { notify, notifyAll } from "../helpers/notify";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

const serialize = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
};

// ─── MEMBERS ────────────────────────────────────────────────────────────────

// GET /api/admin/members (public — used by Community page)
router.get("/admin/members", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const status = req.query.status as string | undefined;
    const conditions = [eq(membersTable.communityId, communityId)];
    if (status) conditions.push(eq(membersTable.status, status));
    const rows = await db
      .select()
      .from(membersTable)
      .where(and(...conditions))
      .orderBy(desc(membersTable.joinDate));
    void res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Failed to list members");
    void res.status(500).json({ error: "Failed to list members" });
  }
});

// POST /api/admin/members — join request (public)
router.post("/admin/members", async (req, res) => {
  try {
    const { communityId = "default", userId, name, unitNumber, phone = "", role = "resident" } = req.body;
    if (!userId || !name || !unitNumber) {
      void res.status(400).json({ error: "userId, name, unitNumber required" });
      return;
    }
    const status = req.body.status ?? "pending";
    const [row] = await db
      .insert(membersTable)
      .values({ communityId, userId, name, unitNumber, phone, role, status, isVerified: false })
      .returning();
    void res.status(201).json(serialize(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create member");
    void res.status(500).json({ error: "Failed to create member" });
  }
});

// PATCH /api/admin/members/:id/approve — admin only
router.patch("/admin/members/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [row] = await db
      .update(membersTable)
      .set({ status: "approved" })
      .where(eq(membersTable.id, parseInt(req.params.id as string, 10)))
      .returning();
    if (!row) { void res.status(404).json({ error: "Not found" }); return; }
    notify({ userId: row.userId, type: "approved", title: "Your membership was approved! 🎉", body: "Welcome to the community. You can now post and participate.", link: "/feed" });
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/admin/members/:id/reject — admin only
router.patch("/admin/members/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [row] = await db
      .update(membersTable)
      .set({ status: "rejected" })
      .where(eq(membersTable.id, parseInt(req.params.id as string, 10)))
      .returning();
    if (!row) { void res.status(404).json({ error: "Not found" }); return; }
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/admin/members/:id/verify — admin only
router.patch("/admin/members/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const existing = await db.select().from(membersTable).where(eq(membersTable.id, id)).limit(1);
    if (!existing[0]) { void res.status(404).json({ error: "Not found" }); return; }
    const [row] = await db.update(membersTable).set({ isVerified: !existing[0].isVerified }).where(eq(membersTable.id, id)).returning();
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/admin/members/:id/role — admin only
router.patch("/admin/members/:id/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) { void res.status(400).json({ error: "role required" }); return; }
    const [row] = await db
      .update(membersTable)
      .set({ role })
      .where(eq(membersTable.id, parseInt(req.params.id as string, 10)))
      .returning();
    if (!row) { void res.status(404).json({ error: "Not found" }); return; }
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// DELETE /api/admin/members/:id — admin only
router.delete("/admin/members/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.delete(membersTable).where(eq(membersTable.id, parseInt(req.params.id as string, 10)));
    void res.json({ ok: true });
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// ─── POSTS ──────────────────────────────────────────────────────────────────

// GET /api/admin/posts
router.get("/admin/posts", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const rows = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.communityId, communityId))
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    void res.json(rows.map(serialize));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// DELETE /api/admin/posts/:id — admin or moderator
router.delete("/admin/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.delete(postsTable).where(eq(postsTable.id, parseInt(req.params.id as string, 10)));
    void res.json({ ok: true });
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/admin/posts/:id/pin — admin or moderator
router.patch("/admin/posts/:id/pin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const existing = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!existing[0]) { void res.status(404).json({ error: "Not found" }); return; }
    const [row] = await db.update(postsTable).set({ isPinned: !existing[0].isPinned }).where(eq(postsTable.id, id)).returning();
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// ─── COMMUNITY SETTINGS ──────────────────────────────────────────────────────

// GET /api/admin/community
router.get("/admin/community", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    let rows = await db.select().from(communitySettingsTable).where(eq(communitySettingsTable.communityId, communityId)).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(communitySettingsTable).values({ communityId, name: "My Mohalla", area: "", city: "", rules: "" }).returning();
      rows = [created];
    }
    void res.json(serialize(rows[0]));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// PUT /api/admin/community — admin only
router.put("/admin/community", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { communityId = "default", name, area, city, logoUrl, rules } = req.body;
    const existing = await db.select().from(communitySettingsTable).where(eq(communitySettingsTable.communityId, communityId)).limit(1);
    let row;
    if (existing.length === 0) {
      [row] = await db.insert(communitySettingsTable).values({ communityId, name: name || "My Mohalla", area: area || "", city: city || "", logoUrl, rules: rules || "" }).returning();
    } else {
      const updates: Partial<typeof communitySettingsTable.$inferInsert> = {};
      if (name !== undefined) updates.name = name;
      if (area !== undefined) updates.area = area;
      if (city !== undefined) updates.city = city;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (rules !== undefined) updates.rules = rules;
      [row] = await db.update(communitySettingsTable).set(updates).where(eq(communitySettingsTable.communityId, communityId)).returning();
    }
    void res.json(serialize(row));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// ─── STATS ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get("/admin/stats", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalMembers, postsThisMonth, activeListings, pendingMembers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(membersTable).where(and(eq(membersTable.communityId, communityId), eq(membersTable.status, "approved"))),
      db.select({ count: sql<number>`count(*)` }).from(postsTable).where(and(eq(postsTable.communityId, communityId), gte(postsTable.createdAt, startOfMonth))),
      db.select({ count: sql<number>`count(*)` }).from(listingsTable).where(and(eq(listingsTable.communityId, communityId), eq(listingsTable.status, "available"))),
      db.select({ count: sql<number>`count(*)` }).from(membersTable).where(and(eq(membersTable.communityId, communityId), eq(membersTable.status, "pending"))),
    ]);

    void res.json({
      totalMembers: Number(totalMembers[0]?.count ?? 0),
      postsThisMonth: Number(postsThisMonth[0]?.count ?? 0),
      activeListings: Number(activeListings[0]?.count ?? 0),
      pendingMembers: Number(pendingMembers[0]?.count ?? 0),
    });
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

// POST /api/admin/announcements — admin only
router.post("/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { communityId = "default", title, body } = req.body;
    const { userId, name: userName, unitNumber } = req.user!;

    if (!title || !body) {
      void res.status(400).json({ error: "title and body required" });
      return;
    }
    const [post] = await db.insert(postsTable).values({ communityId, userId, userName, unitNumber, type: "announcement", title, body, imageUrls: [], isPinned: true, likesCount: 0, commentsCount: 0 }).returning();
    notifyAll({ type: "announcement", title: `📢 ${title}`, body: body.slice(0, 100), link: "/feed" }, userId);
    void res.status(201).json(serialize(post));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

export default router;
