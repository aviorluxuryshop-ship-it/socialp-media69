import { createHash, timingSafeEqual } from "node:crypto";

/**
 * HTTP Basic authentication for the private experiments area.
 *
 * Credentials come only from server environment variables (EXPERIMENTS_USER and
 * EXPERIMENTS_PASSWORD) and are never bundled into client code. The check fails
 * closed: with no credentials configured, or a password shorter than the minimum,
 * nobody is let in.
 */

export const MIN_PASSWORD_LENGTH = 16;

export type AuthResult = "ok" | "unauthorized" | "unconfigured";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time string comparison (hashing first makes the buffers equal length). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function checkExperimentAuth(
  authorization: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): AuthResult {
  const user = env.EXPERIMENTS_USER;
  const password = env.EXPERIMENTS_PASSWORD;
  if (!user || !password || password.length < MIN_PASSWORD_LENGTH) return "unconfigured";

  const [scheme, encoded] = (authorization ?? "").trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "basic" || !encoded) return "unauthorized";

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const split = decoded.indexOf(":");
  if (split < 0) return "unauthorized";

  // Evaluate both comparisons so timing does not reveal which one failed.
  const userOk = safeEqual(decoded.slice(0, split), user);
  const passwordOk = safeEqual(decoded.slice(split + 1), password);
  return userOk && passwordOk ? "ok" : "unauthorized";
}
