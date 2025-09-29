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
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-80"} border border-border rounded-lg bg-card shadow-sm transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ق</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">قيود</h2>
                <p className="text-xs text-muted-foreground">نظام المحاسبة</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="px-3 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-2">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`${getNavCls(item.url)} flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup className="px-3 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-2">
              إجراءات سريعة
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url}
                      className={`${getNavCls(item.url)} flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="mt-auto">
          <SidebarGroup className="px-3 py-4">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink 
                        to={item.url}
                        className={`${getNavCls(item.url)} flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
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