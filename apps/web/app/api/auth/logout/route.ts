import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { refreshToken } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { hashToken } from "@/features/auth/lib/jwt";

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

    // 查找并撤销 refresh token
    const tokenHash = hashToken(token);
    await db
      .update(refreshToken)
      .set({ revoked: true })
      .where(eq(refreshToken.tokenHash, tokenHash));

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
