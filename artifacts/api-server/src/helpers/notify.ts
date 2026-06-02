import { db } from "@workspace/db";
import { notificationsTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type NotifType = "comment" | "like" | "approved" | "safety" | "announcement" | "marketplace";

interface NotifInput {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  link?: string;
}

/** Insert a notification row — fire-and-forget (never throws). */
export async function notify(input: NotifInput): Promise<void> {
  try {
    // Respect user notification preferences
    const [prefs] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, input.userId))
      .limit(1);

    if (prefs) {
      if (input.type === "comment"      && !prefs.notifyComments)      return;
      if (input.type === "like"         && !prefs.notifyLikes)         return;
      if (input.type === "safety"       && !prefs.notifySafety)        return;
      if (input.type === "announcement" && !prefs.notifyAnnouncements) return;
      if (input.type === "marketplace"  && !prefs.notifyMarketplace)   return;
      if (input.type === "approved"     && !prefs.notifyApprovals)     return;
    }

    await db.insert(notificationsTable).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? "",
    });
  } catch {
    // never let notification failures crash the main request
  }
}

/** Broadcast a notification to ALL residents except the sender. */
export async function notifyAll(
  input: Omit<NotifInput, "userId">,
  excludeUserId?: string,
): Promise<void> {
  try {
    const profiles = await db.select({ userId: userProfilesTable.userId }).from(userProfilesTable);
    const known = new Set(profiles.map((p) => p.userId));
    if (excludeUserId) known.delete(excludeUserId);

    await Promise.all(
      [...known].map((userId) => notify({ ...input, userId }))
    );
  } catch {
    // never crash
  }
}
