import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, verifyToken } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userId: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, - and _"),
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  unitNumber: z.string().min(1, "Unit number is required").max(20),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({
      error: "Validation failed",
      fields: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password, userId, name, unitNumber } = parsed.data;

  try {
    const [byEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    if (byEmail) {
      void res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const [byUserId] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.userId, userId))
      .limit(1);
    if (byUserId) {
      void res.status(409).json({ error: "This username is already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(usersTable)
      .values({ email: email.toLowerCase(), passwordHash, userId, name, unitNumber, role: "resident" })
      .returning();

    const token = signToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
      unitNumber: user.unitNumber,
      role: user.role,
    });

    void res.status(201).json({
      token,
      user: { userId: user.userId, email: user.email, name: user.name, unitNumber: user.unitNumber, role: user.role },
    });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    void res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    void res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    if (!user) {
      void res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      void res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
      unitNumber: user.unitNumber,
      role: user.role,
    });

    void res.json({
      token,
      user: { userId: user.userId, email: user.email, name: user.name, unitNumber: user.unitNumber, role: user.role },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    void res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/auth/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    void res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = verifyToken(header.slice(7));
  if (!user) {
    void res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  void res.json({ user });
});

export default router;
