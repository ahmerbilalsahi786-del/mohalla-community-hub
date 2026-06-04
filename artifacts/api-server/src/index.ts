import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  seedDemoUser();
});

async function seedDemoUser() {
  // Only seed in development — never create known-credential accounts in production
  if (process.env.NODE_ENV === "production") return;

  try {
    const [{ db, usersTable }, { eq }, bcrypt] = await Promise.all([
      import("@workspace/db"),
      import("drizzle-orm"),
      import("bcryptjs"),
    ]);
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "ahmed@mohalla.app"))
      .limit(1);
    if (!existing[0]) {
      const passwordHash = await bcrypt.hash("demo1234", 10);
      await db.insert(usersTable).values({
        email: "ahmed@mohalla.app",
        passwordHash,
        userId: "ahmed",
        name: "Ahmed Khan",
        unitNumber: "B-204",
        role: "admin",
      });
      logger.info("Demo user seeded (dev only): ahmed@mohalla.app / demo1234");
    }
  } catch (err) {
    logger.warn({ err }, "Demo user seeding skipped");
  }
}
