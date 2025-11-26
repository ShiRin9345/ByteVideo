import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { user } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";

export const GET = withAuth(async (req: AuthenticatedRequest, { params }) => {
  await params; // 即使不使用 params，也需要 await 它（Next.js 15 要求）
  try {
    if (!req.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, req.user.userId),
    });

    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        name: foundUser.name,
        image: foundUser.image,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
