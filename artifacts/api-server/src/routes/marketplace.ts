import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, or, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const CATEGORIES = ["electronics", "furniture", "clothing", "books", "appliances", "vehicles", "services", "other"] as const;
const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;

const CreateListingSchema = z.object({
  communityId: z.string().optional().default("default"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title must be at most 150 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be at most 2000 characters"),
  pricePkr: z.number().min(0, "Price cannot be negative").max(99999999, "Price is too large").optional().nullable(),
  category: z.enum(["electronics", "furniture", "clothing", "books", "appliances", "vehicles", "services", "other"]).optional().default("other"),
  imageUrls: z.array(z.string()).max(6, "At most 6 images allowed").optional().default([]),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional().default("good"),
  whatsappNumber: z
    .string()
    .regex(/^03\d{9}$/, "WhatsApp number must be in Pakistani format: 03XXXXXXXXX")
    .min(1, "WhatsApp number is required"),
});

// GET /api/marketplace
router.get("/marketplace", async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string, 10) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string, 10) : undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "24", 10);
    const offset = (page - 1) * limit;

    const conditions = [eq(listingsTable.communityId, communityId)];

    if (category && category !== "all") {
      conditions.push(eq(listingsTable.category, category));
    }
    if (minPrice !== undefined) {
      conditions.push(gte(listingsTable.pricePkr, minPrice));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(listingsTable.pricePkr, maxPrice));
    }
    if (search && search.trim()) {
      conditions.push(
        or(
          ilike(listingsTable.title, `%${search.trim()}%`),
          ilike(listingsTable.description, `%${search.trim()}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [listings, countResult] = await Promise.all([
      db.select().from(listingsTable).where(whereClause).orderBy(desc(listingsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(listingsTable).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    void res.json({
      listings: listings.map(serialize),
      total,
      page,
      limit,
      hasMore: offset + listings.length < total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list listings");
    void res.status(500).json({ error: "Failed to list listings" });
  }
});

// POST /api/marketplace
router.post("/marketplace", requireAuth, async (req, res) => {
  const parsed = CreateListingSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({
      error: "Validation failed",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { communityId, title, description, pricePkr, category, imageUrls, condition, whatsappNumber } = parsed.data;
    const { userId, name: userName, unitNumber } = req.user!;

    const [listing] = await db
      .insert(listingsTable)
      .values({ communityId, userId, userName, unitNumber, title, description, pricePkr: pricePkr ?? null, category, imageUrls, condition, status: "available", whatsappNumber })
      .returning();

    void res.status(201).json(serialize(listing));
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    void res.status(500).json({ error: "Failed to create listing" });
  }
});

// GET /api/marketplace/:id
router.get("/marketplace/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

    if (!listing) {
      void res.status(404).json({ error: "Listing not found" });
      return;
    }

    void res.json(serialize(listing));
  } catch (err) {
    req.log.error({ err }, "Failed to get listing");
    void res.status(500).json({ error: "Failed to get listing" });
  }
});

// PATCH /api/marketplace/:id/status — owner or admin only
router.patch("/marketplace/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    if (!["available", "sold", "reserved"].includes(status)) {
      void res.status(400).json({ error: "status must be available, sold, or reserved" });
      return;
    }

    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
    if (!listing) {
      void res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.userId !== req.user!.userId && req.user!.role !== "admin") {
      void res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db
      .update(listingsTable)
      .set({ status })
      .where(eq(listingsTable.id, id))
      .returning();

    void res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update listing status");
    void res.status(500).json({ error: "Failed to update status" });
  }
});

function serialize(l: typeof listingsTable.$inferSelect) {
  return {
    ...l,
    createdAt: l.createdAt.toISOString(),
    imageUrls: l.imageUrls ?? [],
  };
}

export default router;
