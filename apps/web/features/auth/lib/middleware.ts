import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    username: string;
    email: string;
  };
}

export async function authenticateToken(
  req: NextRequest,
): Promise<
  { user: { userId: string; username: string; email: string } } | NextResponse
> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return NextResponse.json(
      {
        code: "NO_TOKEN",
        message: "Access token required",
      },
      { status: 401 },
    );
  }

  try {
    const decoded = verifyToken(token, "access");
    return {
      user: {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOKEN_EXPIRED") {
        return NextResponse.json(
          {
            code: "TOKEN_EXPIRED",
            message: "Access token has expired",
          },
          { status: 401 },
        );
      }
      if (error.message === "TOKEN_INVALID") {
        return NextResponse.json(
          {
            code: "TOKEN_INVALID",
            message: "Access token is invalid",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      {
        code: "TOKEN_INVALID",
        message: "Access token is invalid",
      },
      { status: 403 },
    );
  }
}

export function withAuth<
  T extends Record<string, string> = Record<string, never>,
>(
  handler: (
    req: AuthenticatedRequest,
    context: { params: Promise<T> },
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: { params: Promise<T> }) => {
    const authResult = await authenticateToken(req);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    (req as AuthenticatedRequest).user = authResult.user;

    return handler(req as AuthenticatedRequest, context);
  };
}
