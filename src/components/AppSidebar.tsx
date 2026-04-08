import {
  MessageCircle,
  Radio,
  BookOpen,
  Users,
  TrendingDown,
  Plug,
  Settings,
  Plus,
  Search,
  Home,
  Clock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { HugoMark } from "@/components/HugoMark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Dashboard", url: "/dashboard", icon: TrendingDown },
  { title: "Intel Feed", url: "/intel", icon: Radio },
  { title: "Playbooks", url: "/playbooks", icon: BookOpen },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Integrations", url: "/integrations", icon: Plug },
];

function IconButton({
  icon: Icon,
  label,
  onClick,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
            isActive
              ? "bg-accent text-primary-app"
              : "text-muted-foreground hover:bg-accent hover:text-primary-app"
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="px-0 pt-4 pb-2 flex items-center">
        <div className="flex flex-col items-center gap-2 w-full">
          <button onClick={() => navigate("/")} className="mb-1">
            <HugoMark size={30} />
          </button>
          <IconButton
            icon={Plus}
            label="New Chat"
            onClick={() => navigate("/chat")}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0 pt-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col items-center gap-0.5">
              {navItems.map((item) => {
                const isActive =
                  item.url === "/intel"
                    ? location.pathname === "/intel"
                    : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="w-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/intel"}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors !p-0",
                              isActive
                                ? "bg-accent text-primary-app"
                                : "text-muted-foreground hover:bg-accent hover:text-primary-app"
                            )}
                            activeClassName=""
                          >
                            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-0 pb-4 flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary-app"
              activeClassName="bg-accent text-primary-app"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Settings
          </TooltipContent>
        </Tooltip>

        <div className="h-px w-6 bg-border my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-muted-foreground hover:bg-foreground/10 transition-colors">
              JD
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Jane Doe · Growth plan
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
