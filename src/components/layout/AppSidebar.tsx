import {
  LayoutDashboard,
  ListChecks,
  Zap,
  Heart,
  ClipboardList,
  BrainCircuit,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";

type TranslationKey = keyof typeof translations['en'];

const AppSidebar = () => {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const collapsed = state === "collapsed";

  const navItems: { title: string; key: TranslationKey; url: string; icon: any }[] = [
    { title: "Dashboard", key: "dashboard", url: "/", icon: LayoutDashboard },
    { title: "Sheep Registry", key: "sheepRegistry", url: "/sheep", icon: ListChecks },
    { title: "Herding Mode", key: "herdingMode", url: "/herding", icon: Zap },
    { title: "Breeding", key: "breeding", url: "/breeding", icon: Heart },
    { title: "Matchmaker", key: "matchmaker", url: "/matchmaker", icon: BrainCircuit },
    { title: "Daily Tasks", key: "dailyTasks", url: "/tasks", icon: ClipboardList },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
            SC
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-heading font-bold text-sidebar-foreground text-base leading-tight">
                {t('shepherdCare')}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight">
                {t('livestockIntelligence')}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            {t('navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild tooltip={t(item.key)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 rounded-xl transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{t(item.key)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
