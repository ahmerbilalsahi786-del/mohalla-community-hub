import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { pollsTable, pollVotesTable } from "@workspace/db";
import { eq, and, desc, asc, lte, gt } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

const ser = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
};

const CreatePollSchema = z.object({
  communityId: z.string().optional().default("default"),
  question: z.string().min(5, "Question must be at least 5 characters").max(500),
  options: z
    .array(z.string().min(1).max(100, "Each option must be at most 100 characters"))
    .min(2, "Poll must have at least 2 options")
    .max(6, "Poll can have at most 6 options"),
  endsAt: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Poll end date must be in the future",
  }),
});

async function buildPollResult(poll: typeof pollsTable.$inferSelect, userId: string) {
  const votes = await db.select().from(pollVotesTable).where(eq(pollVotesTable.pollId, poll.id));

  const totalVotes = votes.length;
  const myVote = votes.find((v) => v.userId === userId);
  const voteCounts = (poll.options ?? []).map((_: string, i: number) =>
    votes.filter((v) => v.optionIndex === i).length
  );

  return {
    ...ser(poll as unknown as Record<string, unknown>),
    totalVotes,
    voteCounts,
    myVoteIndex: myVote?.optionIndex ?? null,
    isEnded: new Date() > new Date(poll.endsAt),
  };
}

// GET /api/polls
router.get("/polls", optionalAuth, async (req, res) => {
  try {
    const communityId = (req.query.communityId as string) || "default";
    const userId = req.user?.userId ?? (req.query.userId as string) ?? "guest";
    const now = new Date();

    const [active, ended] = await Promise.all([
      db
        .select()
        .from(pollsTable)
        .where(and(eq(pollsTable.communityId, communityId), gt(pollsTable.endsAt, now)))
        .orderBy(asc(pollsTable.endsAt)),
      db
        .select()
        .from(pollsTable)
        .where(and(eq(pollsTable.communityId, communityId), lte(pollsTable.endsAt, now)))
        .orderBy(desc(pollsTable.endsAt))
        .limit(10),
    ]);

    const [activeResults, endedResults] = await Promise.all([
      Promise.all(active.map((p) => buildPollResult(p, userId))),
      Promise.all(ended.map((p) => buildPollResult(p, userId))),
    ]);

    void res.json({ active: activeResults, ended: endedResults });
  } catch (err) {
    req.log.error({ err }, "Failed to list polls");
    void res.status(500).json({ error: "Failed" });
  }
});

// POST /api/polls
router.post("/polls", requireAuth, async (req, res) => {
  const parsed = CreatePollSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({
      error: "Validation failed",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { communityId, question, options, endsAt } = parsed.data;
    const { userId, name: userName, unitNumber } = req.user!;

    const [row] = await db
      .insert(pollsTable)
      .values({ communityId, userId, userName, unitNumber, question, options, endsAt: new Date(endsAt) })
      .returning();

    void res.status(201).json(await buildPollResult(row, userId));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

// POST /api/polls/:id/vote
router.post("/polls/:id/vote", requireAuth, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id as string, 10);
    const { userId, name: userName } = req.user!;
    const { optionIndex } = req.body;

    if (optionIndex === undefined) {
      void res.status(400).json({ error: "optionIndex required" });
      return;
    }

    const poll = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
    if (!poll[0]) {
      void res.status(404).json({ error: "Poll not found" });
      return;
    }
    if (new Date() > new Date(poll[0].endsAt)) {
      void res.status(400).json({ error: "Poll has ended" });
      return;
    }
    if (poll[0].userId === userId) {
      void res.status(400).json({ error: "You cannot vote on your own poll" });
      return;
    }

    const existing = await db
      .select()
      .from(pollVotesTable)
      .where(and(eq(pollVotesTable.pollId, pollId), eq(pollVotesTable.userId, userId)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(pollVotesTable)
        .set({ optionIndex })
        .where(eq(pollVotesTable.id, existing[0].id));
    } else {
      await db.insert(pollVotesTable).values({ pollId, userId, userName, optionIndex });
    }

    void res.json(await buildPollResult(poll[0], userId));
  } catch (err) {
    void res.status(500).json({ error: "Failed" });
  }
});

export default router;
