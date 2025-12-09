"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, FolderKanban, Wand2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { LoginDialog } from "./login-dialog";
import { useState } from "react";

const navigation = [
  { name: "首页", href: "/explore", icon: Home },
  { name: "创作", href: "/create", icon: Sparkles },
  { name: "AI 生成", href: "/ai-generate", icon: Wand2 },
  { name: "管理", href: "/manage", icon: FolderKanban },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/explore" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // 需要登录的路由
  const protectedRoutes = ["/create", "/manage", "/ai-generate"];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // explore 页面不需要登录
    if (href === "/explore") {
      return;
    }

    // 如果是受保护的路由且用户未登录，显示登录对话框
    if (protectedRoutes.includes(href) && !isAuthenticated) {
      e.preventDefault();
      setLoginDialogOpen(true);
    }
  };

  // 登录页面不显示底部导航
  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <nav className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Login Dialog */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </>
  );
}
