import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { user, refreshToken } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/features/auth/lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "@/features/auth/lib/jwt";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // 验证输入
    if (!password || (!username && !email)) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 },
      );
    }

    // 查找用户（支持用户名或邮箱登录）
    const foundUser = await db.query.user.findFirst({
      where: username ? eq(user.username, username) : eq(user.email, email!),
    });

    if (!foundUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, foundUser.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 生成 tokens
    const accessToken = generateAccessToken(
      foundUser.id,
      foundUser.username,
      foundUser.email,
    );
    const newRefreshToken = generateRefreshToken(
      foundUser.id,
      foundUser.username,
      foundUser.email,
    );

    // 存储 refresh token
    const refreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await db.insert(refreshToken).values({
      id: randomUUID(),
      userId: foundUser.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      revoked: false,
    });

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        name: foundUser.name,
        image: foundUser.image,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
