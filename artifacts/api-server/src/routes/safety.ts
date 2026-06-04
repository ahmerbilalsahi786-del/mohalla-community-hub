import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { alertsTable, alertCommentsTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { notifyAll } from "../helpers/notify";
import { requireAuth } from "../middleware/auth";

const router = Router();

const CreateAlertSchema = z.object({
  communityId: z.string().optional().default("default"),
  type: z.enum([
    "theft",
    "fire",
    "harassment",
    "flooding",
    "suspicious_activity",
    "power_outage",
    "water_issue",
    "noise",
    "other",
  ]),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(3000),
  locationDetail: z.string().max(500).optional().default(""),
  imageUrl: z.string().optional(),
  severity: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

function serializeAlert(a: typeof alertsTable.$inferSelect) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}
function serializeComment(c: typeof alertCommentsTable.$inferSelect) {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

// GET /api/safety
router.get("/safety", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const resolved =
      req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : undefined;

    const conditions = [eq(alertsTable.communityId, communityId)];
    if (resolved !== undefined) conditions.push(eq(alertsTable.isResolved, resolved));

    const alerts = await db
      .select()
      .from(alertsTable)
      .where(and(...conditions))
      .orderBy(desc(alertsTable.createdAt));

    void res.json(alerts.map(serializeAlert));
  } catch (err) {
    req.log.error({ err }, "Failed to list alerts");
    void res.status(500).json({ error: "Failed to list alerts" });
  }
});

// POST /api/safety
router.post("/safety", requireAuth, async (req, res) => {
  const parsed = CreateAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({
      error: "Validation failed",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { communityId, type, title, description, locationDetail, imageUrl, severity } = parsed.data;
    const { userId, name: userName, unitNumber } = req.user!;

    const [alert] = await db
      .insert(alertsTable)
      .values({ communityId, userId, userName, unitNumber, type, title, description, locationDetail, imageUrl, severity, isResolved: false })
      .returning();

    notifyAll(
      { type: "safety", title: `⚠️ Safety Alert: ${title}`, body: description.slice(0, 100), link: "/safety" },
      userId,
    );

    void res.status(201).json(serializeAlert(alert));
  } catch (err) {
    req.log.error({ err }, "Failed to create alert");
    void res.status(500).json({ error: "Failed to create alert" });
  }
});

// PATCH /api/safety/:id/resolve — owner or admin/moderator only
router.patch("/safety/:id/resolve", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const existing = await db.select().from(alertsTable).where(eq(alertsTable.id, id)).limit(1);
    if (!existing[0]) {
      void res.status(404).json({ error: "Alert not found" });
      return;
    }
    const { userId, role } = req.user!;
    if (existing[0].userId !== userId && role !== "admin" && role !== "moderator") {
      void res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [alert] = await db
      .update(alertsTable)
      .set({ isResolved: true })
      .where(eq(alertsTable.id, id))
      .returning();
    void res.json(serializeAlert(alert));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// GET /api/safety/:id/comments
router.get("/safety/:id/comments", async (req, res) => {
  try {
    const alertId = parseInt(req.params.id as string, 10);
    const comments = await db
      .select()
      .from(alertCommentsTable)
      .where(eq(alertCommentsTable.alertId, alertId))
      .orderBy(asc(alertCommentsTable.createdAt));
    void res.json(comments.map(serializeComment));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// POST /api/safety/:id/comments
router.post("/safety/:id/comments", requireAuth, async (req, res) => {
  try {
    const alertId = parseInt(req.params.id as string, 10);
    const { userId, name: userName, unitNumber } = req.user!;
    const { body } = req.body;

    if (!body) {
      void res.status(400).json({ error: "body required" });
      return;
    }

    const [comment] = await db
      .insert(alertCommentsTable)
      .values({ alertId, userId, userName, unitNumber, body })
      .returning();

    void res.status(201).json(serializeComment(comment));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

export default router;
