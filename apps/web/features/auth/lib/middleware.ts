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
  // 优先从 Authorization header 读取 token
  const authHeader = req.headers.get("authorization");
  let token = authHeader && authHeader.split(" ")[1];

  // 如果没有 Authorization header，尝试从 cookie 中读取
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name && value) {
            acc[name] = decodeURIComponent(value);
          }
          return acc;
        },
        {} as Record<string, string>,
      );
      token = cookies["access_token"];
    }
  }

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
