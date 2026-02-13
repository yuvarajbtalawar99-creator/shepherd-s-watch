import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ShepherdAssistant } from "../assistant/ShepherdAssistant";

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <ShepherdAssistant />
    </SidebarProvider>
  );
};

export default Layout;
