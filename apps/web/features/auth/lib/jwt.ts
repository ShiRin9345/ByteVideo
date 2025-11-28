import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || "900";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || "604800";

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  type: "access" | "refresh";
}

export function generateAccessToken(
  userId: string,
  username: string,
  email: string,
): string {
  const payload: TokenPayload = {
    userId,
    username,
    email,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: Number(ACCESS_TOKEN_EXPIRY),
  });
}

export function generateRefreshToken(
  userId: string,
  username: string,
  email: string,
): string {
  const payload: TokenPayload = {
    userId,
    username,
    email,
    type: "refresh",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: Number(REFRESH_TOKEN_EXPIRY),
  });
}

export function verifyToken(
  token: string,
  type: "access" | "refresh",
): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (decoded.type !== type) {
      throw new Error(
        `Invalid token type. Expected ${type}, got ${decoded.type}`,
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("TOKEN_EXPIRED");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("TOKEN_INVALID");
    }
    throw error;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
