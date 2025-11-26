"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { Button } from "@workspace/ui/components/button";

export function SignOutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <Button onClick={handleSignOut} className="w-full" variant="outline">
      退出登录
    </Button>
  );
}
