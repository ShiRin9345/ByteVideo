import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { user } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";

interface UpdateProfileRequest {
  image?: string;
}

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProfileRequest = await req.json();
    const { image } = body;

    // 验证至少提供一个要更新的字段
    if (!image) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 },
      );
    }

    // 更新用户头像
    const updatedUser = await db
      .update(user)
      .set({
        image,
        updatedAt: new Date(),
      })
      .where(eq(user.id, req.user.userId))
      .returning();

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = updatedUser[0];
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        name: updated.name,
        image: updated.image,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
