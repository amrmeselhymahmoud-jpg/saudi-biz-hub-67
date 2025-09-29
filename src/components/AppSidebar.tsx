import { useState } from "react"
import { 
  Home, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Menu
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "لوحة التحكم", url: "/", icon: Home },
  { title: "الفواتير", url: "/invoices", icon: FileText },
  { title: "العملاء", url: "/customers", icon: Users },
  { title: "المخزون", url: "/inventory", icon: Package },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
]

const quickActions = [
  { title: "فاتورة جديدة", url: "/invoices/new", icon: Plus },
  { title: "عميل جديد", url: "/customers/new", icon: Users },
  { title: "منتج جديد", url: "/inventory/new", icon: Package },
]

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-r-3 border-primary font-semibold shadow-sm" 
      : "hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/30 text-muted-foreground hover:text-foreground transition-all duration-200"

  return (
    <Sidebar
      side="right"
      className={`${collapsed ? "w-16" : "w-72"} border-l bg-gradient-to-b from-slate-50 to-white shadow-xl transition-all duration-300 z-30`}
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">ق</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">قيود</h2>
                <p className="text-xs text-muted-foreground font-medium">نظام المحاسبة الذكي</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="px-4 py-6">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-4 mb-3 uppercase tracking-wider">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`${getNavCls(item.url)} flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup className="px-4 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-4 mb-3 uppercase tracking-wider">
              إجراءات سريعة
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url}
                      className={`${getNavCls(item.url)} flex items-center space-x-4 px-4 py-2 rounded-xl transition-all duration-200`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="mt-auto border-t border-border/60 bg-gradient-to-r from-muted/30 to-muted/10">
          <SidebarGroup className="px-4 py-4">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12">
                      <NavLink 
                        to={item.url}
                        className={`${getNavCls(item.url)} flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}