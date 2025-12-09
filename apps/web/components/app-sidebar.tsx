"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, FolderKanban, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useAuth } from "@/features/auth";
import { LoginDialog } from "./login-dialog";
import { ModeToggle } from "./mode-toggle";

const navigation = [
  { name: "首页", href: "/explore", icon: Home },
  { name: "创作", href: "/create", icon: Sparkles },
  { name: "管理", href: "/manage", icon: FolderKanban },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/explore" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // 需要登录的路由
  const protectedRoutes = ["/create", "/manage"];

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

  return (
    <>
      <Sidebar
        collapsible="none"
        className="bg-sidebar border-sidebar-border hidden h-screen border-r md:flex [&>div]:border-r-0"
      >
        <SidebarHeader className="flex-shrink-0">
          <div className="flex items-center px-6 py-2">
            <span
              className="text-sidebar-foreground text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Byte Video
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pt-0 pb-4">
          <div className="min-h-0 flex-1">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="text-muted-foreground mb-1 px-4 py-2 text-xs font-semibold tracking-wider uppercase">
                导航
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={`rounded-lg px-4 py-6 text-base font-medium transition-colors duration-150 ${
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          } `}
                        >
                          <Link
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                            className="flex items-center gap-3"
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>

          {/* 账户部分固定在底部 */}
          <div className="border-sidebar-border mt-auto space-y-2 border-t pt-4">
            {/* 主题切换 */}
            <div className="px-2">
              <ModeToggle />
            </div>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full rounded-lg px-4 py-2.5 text-base font-medium transition-colors duration-150">
                    <div className="flex w-full items-center gap-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                        <User className="text-muted-foreground h-4 w-4" />
                      </div>
                      <span className="flex-1 truncate">
                        {user.name || user.username || "用户"}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="right"
                  className="w-48 rounded-lg border shadow-md"
                >
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      window.location.href = "/login";
                    }}
                    className="text-destructive hover:bg-destructive/10 w-full cursor-pointer rounded-md px-3 py-2 text-base transition-colors"
                  >
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                asChild
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full rounded-lg px-4 py-2.5 text-base font-medium transition-colors duration-150"
              >
                <Link href="/login" className="flex items-center gap-3">
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                    <User className="text-muted-foreground h-4 w-4" />
                  </div>
                  <span>登录</span>
                </Link>
              </SidebarMenuButton>
            )}
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Login Dialog */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </>
  );
}
