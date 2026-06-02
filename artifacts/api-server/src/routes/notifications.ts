import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

const ser = (n: typeof notificationsTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
});

// GET /api/notifications?userId=ahmed
router.get("/notifications", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "ahmed";

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

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const [row] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, +req.params.id))
      .returning();
    if (!row) { void res.status(404).json({ error: "Not found" }); return; }
    void res.json(ser(row));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /api/notifications/read-all?userId=ahmed
router.post("/notifications/read-all", async (req, res) => {
  try {
    const userId = (req.body.userId as string) || "ahmed";
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
