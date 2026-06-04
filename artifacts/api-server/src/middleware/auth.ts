import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  unitNumber: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

/** Middleware: attach req.user if a valid Bearer token is present. Does NOT reject. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

/** Middleware: require a valid Bearer token — returns 401 otherwise. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    void res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = header.slice(7);
  const user = verifyToken(token);
  if (!user) {
    void res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.user = user;
  next();
}

/** Middleware: require admin or moderator role. Must run after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    void res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    void res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
