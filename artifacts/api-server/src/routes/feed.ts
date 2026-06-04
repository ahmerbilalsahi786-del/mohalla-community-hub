import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { postsTable, commentsTable, postLikesTable } from "@workspace/db";
import { eq, desc, and, asc, sql } from "drizzle-orm";
import { notify, notifyAll } from "../helpers/notify";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

const CreatePostSchema = z.object({
  communityId: z.string().optional().default("default"),
  type: z.enum(["general", "announcement", "question", "recommendation", "event", "lost_found"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
  body: z.string().min(10, "Body must be at least 10 characters").max(5000, "Body must be at most 5000 characters"),
  imageUrls: z.array(z.string()).max(4, "At most 4 images allowed").optional().default([]),
  isPinned: z.boolean().optional().default(false),
});

const CreateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000, "Comment must be at most 2000 characters"),
});

// GET /api/feed - list posts
router.get("/feed", optionalAuth, async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const category = req.query.category as string | undefined;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = (page - 1) * limit;

    const conditions = [eq(postsTable.communityId, communityId)];
    if (category && category !== "all") {
      conditions.push(eq(postsTable.type, category));
    }

    const whereClause = and(...conditions);

    const [allPosts, countResult] = await Promise.all([
      db
        .select()
        .from(postsTable)
        .where(whereClause)
        .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(postsTable)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    void res.json({
      posts: allPosts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        imageUrls: p.imageUrls ?? [],
      })),
      total,
      page,
      limit,
      hasMore: offset + allPosts.length < total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list posts");
    void res.status(500).json({ error: "Failed to list posts" });
  }
});

// POST /api/feed - create post
router.post("/feed", requireAuth, async (req, res) => {
  const parsed = CreatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({
      error: "Validation failed",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { communityId, type, title, body, imageUrls, isPinned } = parsed.data;
    const { userId, name: userName, unitNumber } = req.user!;

    const [post] = await db
      .insert(postsTable)
      .values({ communityId, userId, userName, unitNumber, type, title, body, imageUrls, isPinned })
      .returning();

    if (post.type === "announcement") {
      notifyAll(
        { type: "announcement", title: "New announcement", body: post.title, link: "/feed" },
        post.userId,
      );
    }

    void res.status(201).json({
      ...post,
      createdAt: post.createdAt.toISOString(),
      imageUrls: post.imageUrls ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create post");
    void res.status(500).json({ error: "Failed to create post" });
  }
});

// POST /api/feed/:postId/like - toggle like
router.post("/feed/:postId/like", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId as string, 10);
    const userId = req.user!.userId;

    const existing = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!existing[0]) {
      void res.status(404).json({ error: "Post not found" });
      return;
    }

    const [existingLike] = await db
      .select()
      .from(postLikesTable)
      .where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId)))
      .limit(1);

    let isLiking: boolean;
    if (existingLike) {
      await db.delete(postLikesTable).where(eq(postLikesTable.id, existingLike.id));
      isLiking = false;
    } else {
      await db.insert(postLikesTable).values({ postId, userId });
      isLiking = true;
    }

    const [updated] = await db
      .update(postsTable)
      .set({ likesCount: sql`GREATEST(0, ${postsTable.likesCount} + ${isLiking ? 1 : -1})` })
      .where(eq(postsTable.id, postId))
      .returning();

    if (isLiking && existing[0].userId !== userId) {
      notify({
        userId: existing[0].userId,
        type: "like",
        title: `${req.user!.name} liked your post`,
        body: existing[0].title,
        link: "/feed",
      });
    }

    void res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      imageUrls: updated.imageUrls ?? [],
      liked: isLiking,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to toggle like");
    void res.status(500).json({ error: "Failed to toggle like" });
  }
});

// GET /api/feed/:postId/comments
router.get("/feed/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId as string, 10);
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, postId))
      .orderBy(asc(commentsTable.createdAt));

    void res.json(
      comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list comments");
    void res.status(500).json({ error: "Failed to list comments" });
  }
});

// POST /api/feed/:postId/comments
router.post("/feed/:postId/comments", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId as string, 10);
    const { userId, name: userName, unitNumber } = req.user!;

    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      void res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid body" });
      return;
    }
    const { body } = parsed.data;

    const [comment] = await db
      .insert(commentsTable)
      .values({ postId, userId, userName, unitNumber, body })
      .returning();

    await db
      .update(postsTable)
      .set({ commentsCount: sql`${postsTable.commentsCount} + 1` })
      .where(eq(postsTable.id, postId));

    const post = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
    if (post[0] && post[0].userId !== userId) {
      notify({
        userId: post[0].userId,
        type: "comment",
        title: `${userName} commented on your post`,
        body: body.slice(0, 80),
        link: "/feed",
      });
    }

    void res.status(201).json({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    void res.status(500).json({ error: "Failed to create comment" });
  }
});

export default router;
