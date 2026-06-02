import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable, rsvpsTable } from "@workspace/db";
import { eq, and, desc, asc, gte, lt, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const ser = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
};

function todayDateString(): string {
  const now = new Date();
  // Use local date parts to avoid UTC timezone mismatches
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// GET /api/events — upcoming & past
router.get("/events", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const today = todayDateString();

    const [upcoming, past] = await Promise.all([
      db.select().from(eventsTable)
        .where(and(eq(eventsTable.communityId, communityId), gte(eventsTable.date, today)))
        .orderBy(asc(eventsTable.date)),
      db.select().from(eventsTable)
        .where(and(eq(eventsTable.communityId, communityId), lt(eventsTable.date, today)))
        .orderBy(desc(eventsTable.date))
        .limit(10),
    ]);

    res.json({ upcoming: upcoming.map(ser), past: past.map(ser) });
  } catch (err) {
    req.log.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Failed" });
  }
});

// POST /api/events
router.post("/events", requireAuth, async (req, res) => {
  try {
    const { communityId = "default", title, description = "", date, time = "", location = "", imageUrl } = req.body;
    const { userId, name: userName, unitNumber } = req.user!;

    if (!title || !date) {
      void res.status(400).json({ error: "title and date are required" });
      return;
    }

    const [row] = await db.insert(eventsTable).values({
      communityId, userId, userName, unitNumber, title, description, date, time, location, imageUrl
    }).returning();
    res.status(201).json(ser(row));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// GET /api/events/:id/rsvps
router.get("/events/:id/rsvps", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id as string, 10);
    const rows = await db.select().from(rsvpsTable)
      .where(eq(rsvpsTable.eventId, eventId))
      .orderBy(asc(rsvpsTable.createdAt));
    res.json(rows.map(ser));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /api/events/:id/rsvp — upsert
router.post("/events/:id/rsvp", requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id as string, 10);
    const { userId, name: userName } = req.user!;
    const { status } = req.body;

    if (!status) {
      void res.status(400).json({ error: "status required" });
      return;
    }

    const existing = await db.select().from(rsvpsTable)
      .where(and(eq(rsvpsTable.eventId, eventId), eq(rsvpsTable.userId, userId)))
      .limit(1);

    let rsvp;
    if (existing[0]) {
      [rsvp] = await db.update(rsvpsTable).set({ status })
        .where(eq(rsvpsTable.id, existing[0].id)).returning();
    } else {
      [rsvp] = await db.insert(rsvpsTable).values({ eventId, userId, userName, status }).returning();
      // Update rsvp count
      await db.update(eventsTable)
        .set({ rsvpCount: sql`${eventsTable.rsvpCount} + 1` })
        .where(eq(eventsTable.id, eventId));
    }

    res.json(ser(rsvp));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
