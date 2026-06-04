import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const ser = (n: typeof notificationsTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
});

// GET /api/notifications — current user only
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(20);

    const unreadCount = rows.filter((n) => !n.isRead).length;

    res.json({ notifications: rows.map(ser), unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/notifications/:id/read — must own the notification
router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const id = +req.params.id;
    const existing = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    if (!existing[0]) { void res.status(404).json({ error: "Not found" }); return; }
    if (existing[0].userId !== req.user!.userId) { void res.status(403).json({ error: "Forbidden" }); return; }

    const [row] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, id))
      .returning();
    void res.json(ser(row));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /api/notifications/read-all — current user only
router.post("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
