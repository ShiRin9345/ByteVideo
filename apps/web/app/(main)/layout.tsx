import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-x-hidden">
        <main className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
