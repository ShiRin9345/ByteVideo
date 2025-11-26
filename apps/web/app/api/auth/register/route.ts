import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { user, refreshToken } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/features/auth/lib/password";
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
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await db.query.user.findFirst({
      where: eq(user.username, username),
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 },
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const userId = randomUUID();
    const newUser = await db
      .insert(user)
      .values({
        id: userId,
        username,
        email,
        password: passwordHash,
        name: username, // 默认使用用户名作为显示名称
      })
      .returning();

    const createdUser = newUser[0];
    if (!createdUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // 生成 tokens
    const accessToken = generateAccessToken(
      createdUser.id,
      createdUser.username,
      createdUser.email,
    );
    const refreshTokenValue = generateRefreshToken(
      createdUser.id,
      createdUser.username,
      createdUser.email,
    );

    // 存储 refresh token
    const refreshTokenHash = hashToken(refreshTokenValue);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await db.insert(refreshToken).values({
      id: randomUUID(),
      userId: createdUser.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      revoked: false,
    });

    return NextResponse.json({
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        name: createdUser.name,
        image: createdUser.image,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
