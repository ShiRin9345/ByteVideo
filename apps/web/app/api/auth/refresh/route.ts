import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { refreshToken } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "@/features/auth/lib/jwt";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken: token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 },
      );
    }

    // 验证 refresh token
    let decoded;
    try {
      decoded = verifyToken(token, "refresh");
    } catch (error) {
      if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
        return NextResponse.json(
          { error: "Refresh token has expired" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 403 },
      );
    }

    // 查找 refresh token 记录
    const tokenHash = hashToken(token);
    const storedToken = await db.query.refreshToken.findFirst({
      where: and(
        eq(refreshToken.tokenHash, tokenHash),
        eq(refreshToken.userId, decoded.userId),
        eq(refreshToken.revoked, false),
        gt(refreshToken.expiresAt, new Date()),
      ),
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: "Refresh token not found or revoked" },
        { status: 403 },
      );
    }

    // 生成新的 tokens
    const newAccessToken = generateAccessToken(
      decoded.userId,
      decoded.username,
      decoded.email,
    );
    const newRefreshToken = generateRefreshToken(
      decoded.userId,
      decoded.username,
      decoded.email,
    );

    // 撤销旧的 refresh token
    await db
      .update(refreshToken)
      .set({ revoked: true })
      .where(eq(refreshToken.id, storedToken.id));

    // 存储新的 refresh token
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await db.insert(refreshToken).values({
      id: randomUUID(),
      userId: decoded.userId,
      tokenHash: newTokenHash,
      expiresAt,
      revoked: false,
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
